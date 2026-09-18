import {
  ApiError,
  type HasResult,
  type LabStaff,
  type Laboratory,
  type OrderIncludesTest,
  type Paginated,
  type Patient,
  type PatientListItem,
  type PendingResultItem,
  type Report,
  type Sample,
  type Test,
  type TestOrder,
  type WorkspaceSummary,
  patientFullName,
} from '@/types'
import { db, nextId } from './db'
import { toIso, toIsoDate } from './rng'

/**
 * Mock request handlers.
 *
 * Each entry answers one METHOD + path, exactly as the real API will. When the
 * backend is ready this whole file stops being imported: services and UI stay
 * untouched. See services/http.ts for the switch.
 */

type Query = URLSearchParams

interface HandlerContext {
  params: Record<string, string>
  query: Query
  body: unknown
}

type Handler = (context: HandlerContext) => unknown

interface Route {
  method: string
  /** '/orders/:id' style pattern. */
  pattern: string
  handler: Handler
}

// --- helpers ---------------------------------------------------------------

function paginate<T>(rows: T[], query: Query): Paginated<T> {
  const page = Math.max(1, Number(query.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(query.get('pageSize') ?? 20)))
  const start = (page - 1) * pageSize
  return { data: rows.slice(start, start + pageSize), total: rows.length, page, pageSize }
}

const matches = (haystack: string | null | undefined, needle: string) =>
  (haystack ?? '').toLowerCase().includes(needle)

function requireBody<T>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'VALIDATION_FAILED', 'Request body is missing')
  }
  return body as T
}

function sortRows<T>(rows: T[], query: Query, getters: Record<string, (row: T) => string | number>) {
  const sort = query.get('sort')
  if (!sort) return rows
  const getter = getters[sort]
  if (!getter) return rows
  const direction = query.get('order') === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = getter(a)
    const right = getter(b)
    if (left < right) return -1 * direction
    if (left > right) return 1 * direction
    return 0
  })
}

// --- routes ----------------------------------------------------------------

export const routes: Route[] = [
  // ---------- Patients ----------
  {
    method: 'GET',
    pattern: '/patients',
    handler: ({ query }) => {
      const { patients, orders } = db.get()
      const search = (query.get('q') ?? '').trim().toLowerCase()

      let rows: PatientListItem[] = patients.map((patient) => {
        const patientOrders = orders.filter((order) => order.Patient_ID === patient.Patient_ID)
        const lastOrder = patientOrders
          .map((order) => order.Order_Date)
          .sort()
          .at(-1)
        return {
          ...patient,
          Order_Count: patientOrders.length,
          Last_Order_Date: lastOrder ?? null,
        }
      })

      if (search) {
        rows = rows.filter(
          (row) =>
            matches(row.Patient_ID, search) ||
            matches(patientFullName(row), search) ||
            row.Contacts.some((contact) => matches(contact.Contact_No, search)),
        )
      }

      const gender = query.get('gender')
      if (gender) rows = rows.filter((row) => row.Gender === gender)

      rows = sortRows(rows, query, {
        Patient_ID: (row) => row.Patient_ID,
        First_Name: (row) => row.First_Name,
        Last_Order_Date: (row) => row.Last_Order_Date ?? '',
        Order_Count: (row) => row.Order_Count,
      })

      return paginate(rows, query)
    },
  },
  {
    method: 'GET',
    pattern: '/patients/:id',
    handler: ({ params }) => {
      const patient = db.get().patients.find((row) => row.Patient_ID === params.id)
      if (!patient) throw new ApiError(404, 'NOT_FOUND', 'No patient with that ID')
      return patient
    },
  },
  {
    method: 'POST',
    pattern: '/patients',
    handler: ({ body }) => {
      const input = requireBody<{
        First_Name: string
        Last_Name: string
        DOB: string
        Gender: Patient['Gender']
        Contacts: Array<{ Contact_No: string }>
      }>(body)

      return db.update((draft) => {
        const Patient_ID = nextId(
          draft.patients.map((row) => row.Patient_ID),
          'P',
          4,
        )
        const patient: Patient = {
          Patient_ID,
          First_Name: input.First_Name,
          Last_Name: input.Last_Name,
          DOB: input.DOB,
          Gender: input.Gender,
          Contacts: input.Contacts.map((contact) => ({
            Patient_ID,
            Contact_No: contact.Contact_No,
          })),
        }
        draft.patients.unshift(patient)
        return patient
      })
    },
  },

  // ---------- Doctors ----------
  { method: 'GET', pattern: '/doctors', handler: () => db.get().doctors },

  // ---------- Tests ----------
  {
    method: 'GET',
    pattern: '/tests',
    handler: ({ query }) => {
      let rows: Test[] = [...db.get().tests]
      const category = query.get('category')
      if (category) rows = rows.filter((row) => row.Test_Category === category)

      const search = (query.get('q') ?? '').trim().toLowerCase()
      if (search) {
        rows = rows.filter(
          (row) => matches(row.Test_Name, search) || matches(row.Test_ID, search),
        )
      }
      return rows
    },
  },
  {
    method: 'POST',
    pattern: '/tests',
    handler: ({ body }) => {
      const input = requireBody<Omit<Test, 'Test_ID'>>(body)
      return db.update((draft) => {
        const test: Test = {
          Test_ID: nextId(
            draft.tests.map((row) => row.Test_ID),
            'T',
            3,
          ),
          Test_Name: input.Test_Name,
          Test_Category: input.Test_Category,
          Price: input.Price,
          Specimen_Type: input.Test_Category === 'Pathology' ? input.Specimen_Type : null,
          Imaging_Modality: input.Test_Category === 'Radiology' ? input.Imaging_Modality : null,
          Unit: input.Unit ?? null,
        }
        draft.tests.push(test)
        return test
      })
    },
  },

  // ---------- Orders ----------
  {
    method: 'GET',
    pattern: '/orders',
    handler: ({ query }) => {
      let rows: TestOrder[] = [...db.get().orders]

      const status = query.get('status')
      if (status) rows = rows.filter((row) => row.Status === status)

      const patientId = query.get('patientId')
      if (patientId) rows = rows.filter((row) => row.Patient_ID === patientId)

      const search = (query.get('q') ?? '').trim().toLowerCase()
      if (search) {
        rows = rows.filter(
          (row) =>
            matches(row.Order_ID, search) ||
            matches(row.Patient_Name, search) ||
            matches(row.Patient_ID, search),
        )
      }

      rows = sortRows(rows, query, {
        Order_ID: (row) => row.Order_ID,
        Order_Date: (row) => row.Order_Date,
        Total_Price: (row) => row.Total_Price,
      })
      if (!query.get('sort')) rows.sort((a, b) => b.Order_Date.localeCompare(a.Order_Date))

      return paginate(rows, query)
    },
  },
  {
    method: 'GET',
    pattern: '/orders/:id',
    handler: ({ params }) => {
      const order = db.get().orders.find((row) => row.Order_ID === params.id)
      if (!order) throw new ApiError(404, 'NOT_FOUND', 'No order with that ID')
      return order
    },
  },
  {
    method: 'POST',
    pattern: '/orders',
    handler: ({ body }) => {
      const input = requireBody<{
        Patient_ID: string
        Doctor_ID: string
        Test_IDs: string[]
        Order_Date: string
      }>(body)

      return db.update((draft) => {
        const patient = draft.patients.find((row) => row.Patient_ID === input.Patient_ID)
        if (!patient) {
          throw new ApiError(400, 'VALIDATION_FAILED', 'Unknown patient', {
            Patient_ID: 'Select a valid patient',
          })
        }
        const doctor = draft.doctors.find((row) => row.Doctor_ID === input.Doctor_ID) ?? null

        const Order_ID = nextId(
          draft.orders.map((row) => row.Order_ID),
          'O',
          4,
        )

        // Prices come from the catalogue, never from the client.
        const Tests: OrderIncludesTest[] = input.Test_IDs.flatMap((testId) => {
          const test = draft.tests.find((row) => row.Test_ID === testId)
          if (!test) return []
          return [
            {
              Order_ID,
              Test_ID: test.Test_ID,
              Test_Name: test.Test_Name,
              Test_Category: test.Test_Category,
              Price: test.Price,
            },
          ]
        })

        if (Tests.length === 0) {
          throw new ApiError(400, 'VALIDATION_FAILED', 'Select at least one test', {
            Test_IDs: 'Select at least one test',
          })
        }

        const order: TestOrder = {
          Order_ID,
          Order_Date: input.Order_Date || toIsoDate(new Date()),
          Patient_ID: patient.Patient_ID,
          Patient_Name: patientFullName(patient),
          Doctor_ID: doctor?.Doctor_ID ?? null,
          Doctor_Name: doctor?.Doctor_Name ?? null,
          Specialization: doctor?.Specialization ?? null,
          Status: 'Pending',
          Tests,
          Total_Price: Tests.reduce((sum, line) => sum + line.Price, 0),
        }
        draft.orders.unshift(order)
        return order
      })
    },
  },

  // ---------- Samples ----------
  {
    method: 'GET',
    pattern: '/samples',
    handler: ({ query }) => {
      let rows: Sample[] = [...db.get().samples]

      const orderId = query.get('orderId')
      if (orderId) rows = rows.filter((row) => row.Order_ID === orderId)

      const labId = query.get('labId')
      if (labId) rows = rows.filter((row) => row.Lab_ID === labId)

      const techId = query.get('techId')
      if (techId) rows = rows.filter((row) => row.Tech_ID === techId)

      const search = (query.get('q') ?? '').trim().toLowerCase()
      if (search) {
        rows = rows.filter(
          (row) =>
            matches(row.Order_ID, search) ||
            matches(row.Patient_Name, search) ||
            matches(row.Sample_No, search),
        )
      }

      rows.sort((a, b) => b.Collection_DateTime.localeCompare(a.Collection_DateTime))
      return paginate(rows, query)
    },
  },
  {
    method: 'POST',
    pattern: '/samples',
    handler: ({ body }) => {
      const input = requireBody<{
        Order_ID: string
        Sample_No: string
        Sample_Type: Sample['Sample_Type']
        Collection_DateTime: string
        Lab_ID: string
        Tech_ID: string
        Status: Sample['Status']
      }>(body)

      return db.update((draft) => {
        const order = draft.orders.find((row) => row.Order_ID === input.Order_ID)
        if (!order) {
          throw new ApiError(400, 'VALIDATION_FAILED', 'Unknown order', {
            Order_ID: 'Enter a valid order ID',
          })
        }
        if (order.Status === 'Cancelled') {
          throw new ApiError(409, 'CONFLICT', 'This order was cancelled and cannot accept samples')
        }

        const duplicate = draft.samples.some(
          (row) => row.Order_ID === input.Order_ID && row.Sample_No === input.Sample_No,
        )
        if (duplicate) {
          throw new ApiError(409, 'CONFLICT', `Sample ${input.Sample_No} already exists on this order`, {
            Sample_No: 'That sample number is already used on this order',
          })
        }

        const lab = draft.laboratories.find((row) => row.Lab_ID === input.Lab_ID)
        const tech = draft.staff.find(
          (row): row is Extract<LabStaff, { Staff_Role: 'Technician' }> =>
            row.Staff_Role === 'Technician' && row.Tech_ID === input.Tech_ID,
        )
        if (!lab || !tech) {
          throw new ApiError(400, 'VALIDATION_FAILED', 'Select a valid laboratory and technician')
        }

        const sample: Sample = {
          Sample_No: input.Sample_No,
          Order_ID: order.Order_ID,
          Patient_ID: order.Patient_ID,
          Patient_Name: order.Patient_Name,
          Sample_Type: input.Sample_Type,
          Collection_DateTime: input.Collection_DateTime,
          Lab_ID: lab.Lab_ID,
          Lab_Name: lab.Lab_Name,
          Tech_ID: tech.Tech_ID,
          Tech_Name: tech.Staff_Name,
          Status: input.Status ?? 'Collected',
        }
        draft.samples.unshift(sample)

        // Collecting the first sample moves the order into Processing and
        // opens a draft report for the pathologist.
        if (order.Status === 'Pending') {
          order.Status = 'Processing'
          const pathologist = draft.staff.find(
            (row): row is Extract<LabStaff, { Staff_Role: 'Pathologist' }> =>
              row.Staff_Role === 'Pathologist',
          )
          const patient = draft.patients.find((row) => row.Patient_ID === order.Patient_ID)
          if (pathologist && patient) {
            const report: Report = {
              Report_ID: nextId(
                draft.reports.map((row) => row.Report_ID),
                'R',
                4,
              ),
              Order_ID: order.Order_ID,
              Report_Date: null,
              Patient_ID: patient.Patient_ID,
              First_Name: patient.First_Name,
              Last_Name: patient.Last_Name,
              DOB: patient.DOB,
              Gender: patient.Gender,
              Doctor_ID: order.Doctor_ID,
              Doctor_Name: order.Doctor_Name,
              Specialization: order.Specialization,
              Pathologist_ID: pathologist.Pathologist_ID,
              Pathologist_Name: pathologist.Staff_Name,
              Qualification: pathologist.Qualification,
              License_No: pathologist.License_No,
              Order_Date: order.Order_Date,
              Results: [],
            }
            draft.reports.unshift(report)
          }
        }

        return sample
      })
    },
  },

  // ---------- Laboratories ----------
  { method: 'GET', pattern: '/laboratories', handler: () => db.get().laboratories },
  {
    method: 'POST',
    pattern: '/laboratories',
    handler: ({ body }) => {
      const input = requireBody<Omit<Laboratory, 'Lab_ID'>>(body)
      return db.update((draft) => {
        const lab: Laboratory = {
          Lab_ID: nextId(
            draft.laboratories.map((row) => row.Lab_ID),
            'L',
            2,
          ),
          ...input,
        }
        draft.laboratories.push(lab)
        return lab
      })
    },
  },

  // ---------- Staff ----------
  {
    method: 'GET',
    pattern: '/staff',
    handler: ({ query }) => {
      let rows: LabStaff[] = [...db.get().staff]
      const role = query.get('role')
      if (role) rows = rows.filter((row) => row.Staff_Role === role)
      return rows
    },
  },
  {
    method: 'POST',
    pattern: '/staff',
    handler: ({ body }) => {
      const input = requireBody<{
        Staff_Name: string
        Shift: LabStaff['Shift']
        Staff_Role: LabStaff['Staff_Role']
        Certification?: string
        License_No?: string
        Qualification?: string
      }>(body)

      return db.update((draft) => {
        const Staff_ID = nextId(
          draft.staff.map((row) => row.Staff_ID),
          'ST',
          3,
        )
        const member: LabStaff =
          input.Staff_Role === 'Technician'
            ? {
                Staff_ID,
                Staff_Name: input.Staff_Name,
                Shift: input.Shift,
                Staff_Role: 'Technician',
                Tech_ID: Staff_ID,
                Certification: input.Certification ?? '',
              }
            : {
                Staff_ID,
                Staff_Name: input.Staff_Name,
                Shift: input.Shift,
                Staff_Role: 'Pathologist',
                Pathologist_ID: Staff_ID,
                License_No: input.License_No ?? '',
                Qualification: input.Qualification ?? '',
              }
        draft.staff.push(member)
        return member
      })
    },
  },

  // ---------- Reports ----------
  {
    method: 'GET',
    pattern: '/reports',
    handler: ({ query }) => {
      let rows: Report[] = db.get().reports.filter((row) => row.Report_Date !== null)

      const patientId = query.get('patientId')
      if (patientId) rows = rows.filter((row) => row.Patient_ID === patientId)

      const pathologistId = query.get('pathologistId')
      if (pathologistId) rows = rows.filter((row) => row.Pathologist_ID === pathologistId)

      const search = (query.get('q') ?? '').trim().toLowerCase()
      if (search) {
        rows = rows.filter(
          (row) =>
            matches(row.Report_ID, search) ||
            matches(row.Order_ID, search) ||
            matches(`${row.First_Name} ${row.Last_Name}`, search),
        )
      }

      rows.sort((a, b) => (b.Report_Date ?? '').localeCompare(a.Report_Date ?? ''))
      return paginate(rows, query)
    },
  },
  {
    method: 'GET',
    pattern: '/reports/:id',
    handler: ({ params }) => {
      const report = db.get().reports.find((row) => row.Report_ID === params.id)
      if (!report) throw new ApiError(404, 'NOT_FOUND', 'No report with that ID')
      return report
    },
  },
  {
    /** The pathologist's queue: draft reports whose samples are already in. */
    method: 'GET',
    pattern: '/pending-results',
    handler: () => {
      const { reports, orders, samples } = db.get()
      const items: PendingResultItem[] = reports
        .filter((report) => report.Report_Date === null)
        .map((report) => {
          const order = orders.find((row) => row.Order_ID === report.Order_ID)
          const orderSamples = samples.filter((row) => row.Order_ID === report.Order_ID)
          const lastCollection = orderSamples
            .map((row) => row.Collection_DateTime)
            .sort()
            .at(-1)
          return {
            Report_ID: report.Report_ID,
            Order_ID: report.Order_ID,
            Order_Date: report.Order_Date,
            Patient_ID: report.Patient_ID,
            Patient_Name: `${report.First_Name} ${report.Last_Name}`,
            Test_Count: order?.Tests.length ?? 0,
            Sample_Count: orderSamples.length,
            Last_Collection_DateTime: lastCollection ?? null,
          }
        })
        .filter((item) => item.Sample_Count > 0)

      items.sort((a, b) =>
        (a.Last_Collection_DateTime ?? '').localeCompare(b.Last_Collection_DateTime ?? ''),
      )
      return items
    },
  },
  {
    method: 'PUT',
    pattern: '/reports/:id/results',
    handler: ({ params, body }) => {
      const input = requireBody<{
        Results: Array<{
          Test_ID: string
          Observed_Value: string
          Unit?: string | null
          Remark: HasResult['Remark']
        }>
      }>(body)

      return db.update((draft) => {
        const report = draft.reports.find((row) => row.Report_ID === params.id)
        if (!report) throw new ApiError(404, 'NOT_FOUND', 'No report with that ID')

        const order = draft.orders.find((row) => row.Order_ID === report.Order_ID)
        if (!order) throw new ApiError(409, 'CONFLICT', 'The order behind this report is missing')

        report.Results = input.Results.flatMap((row) => {
          const line = order.Tests.find((test) => test.Test_ID === row.Test_ID)
          if (!line) return []
          return [
            {
              Report_ID: report.Report_ID,
              Test_ID: line.Test_ID,
              Test_Name: line.Test_Name,
              Test_Category: line.Test_Category,
              Observed_Value: row.Observed_Value,
              Unit: row.Unit ?? null,
              Remark: row.Remark,
            },
          ]
        })

        report.Report_Date = toIso(new Date())
        order.Status = 'Completed'
        return report
      })
    },
  },

  // ---------- Workspace summary ----------
  {
    method: 'GET',
    pattern: '/analytics/summary',
    handler: () => {
      const { patients, orders, samples, reports, tests, staff, laboratories } = db.get()
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

      const summary: WorkspaceSummary = {
        Patient_Count: patients.length,
        Orders_By_Status: { Pending: 0, Processing: 0, Completed: 0, Cancelled: 0 },
        Orders_Last_7_Days: 0,
        Revenue_Booked: 0,
        Samples_By_Status: { Collected: 0, 'In Transit': 0, Received: 0, Rejected: 0 },
        Samples_Last_7_Days: 0,
        Pending_Results: 0,
        Reports_Issued: 0,
        Findings_By_Remark: { Normal: 0, Elevated: 0, Critical: 0 },
        Test_Count: tests.length,
        Staff_Count: staff.length,
        Laboratory_Count: laboratories.length,
      }

      for (const order of orders) {
        summary.Orders_By_Status[order.Status] += 1
        if (order.Status !== 'Cancelled') summary.Revenue_Booked += order.Total_Price
        if (new Date(order.Order_Date).getTime() >= weekAgo) summary.Orders_Last_7_Days += 1
      }

      for (const sample of samples) {
        summary.Samples_By_Status[sample.Status] += 1
        if (new Date(sample.Collection_DateTime).getTime() >= weekAgo) summary.Samples_Last_7_Days += 1
      }

      const ordersWithSamples = new Set(samples.map((sample) => sample.Order_ID))
      for (const report of reports) {
        if (report.Report_Date === null) {
          if (ordersWithSamples.has(report.Order_ID)) summary.Pending_Results += 1
          continue
        }
        summary.Reports_Issued += 1
        for (const result of report.Results) summary.Findings_By_Remark[result.Remark] += 1
      }

      return summary
    },
  },

  // ---------- Updates and deletes ----------
  {
    method: 'PATCH',
    pattern: '/patients/:id',
    handler: ({ params, body }) => {
      const input = requireBody<{
        First_Name: string
        Last_Name: string
        DOB: string
        Gender: Patient['Gender']
        Contacts: Array<{ Contact_No: string }>
      }>(body)

      return db.update((draft) => {
        const patient = draft.patients.find((row) => row.Patient_ID === params.id)
        if (!patient) throw new ApiError(404, 'NOT_FOUND', 'No patient with that ID')

        patient.First_Name = input.First_Name
        patient.Last_Name = input.Last_Name
        patient.DOB = input.DOB
        patient.Gender = input.Gender
        patient.Contacts = input.Contacts.map((contact) => ({
          Patient_ID: patient.Patient_ID,
          Contact_No: contact.Contact_No,
        }))

        // Orders and reports carry the patient name inline for list views, so
        // a rename has to reach them or the tables disagree with the record.
        const fullName = patientFullName(patient)
        for (const order of draft.orders) {
          if (order.Patient_ID === patient.Patient_ID) order.Patient_Name = fullName
        }
        for (const sample of draft.samples) {
          if (sample.Patient_ID === patient.Patient_ID) sample.Patient_Name = fullName
        }
        for (const report of draft.reports) {
          if (report.Patient_ID !== patient.Patient_ID) continue
          report.First_Name = patient.First_Name
          report.Last_Name = patient.Last_Name
          report.DOB = patient.DOB
          report.Gender = patient.Gender
        }

        return patient
      })
    },
  },
  {
    method: 'DELETE',
    pattern: '/patients/:id',
    handler: ({ params }) =>
      db.update((draft) => {
        const index = draft.patients.findIndex((row) => row.Patient_ID === params.id)
        if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'No patient with that ID')

        const orderCount = draft.orders.filter((row) => row.Patient_ID === params.id).length
        if (orderCount > 0) {
          throw new ApiError(
            409,
            'CONFLICT',
            `This patient has ${orderCount} order(s) on file and cannot be deleted. Cancel or remove the orders first.`,
          )
        }

        draft.patients.splice(index, 1)
        return { ok: true }
      }),
  },

  {
    method: 'PATCH',
    pattern: '/tests/:id',
    handler: ({ params, body }) => {
      const input = requireBody<Omit<Test, 'Test_ID'>>(body)
      return db.update((draft) => {
        const test = draft.tests.find((row) => row.Test_ID === params.id)
        if (!test) throw new ApiError(404, 'NOT_FOUND', 'No test with that ID')

        test.Test_Name = input.Test_Name
        test.Test_Category = input.Test_Category
        test.Price = input.Price
        test.Specimen_Type = input.Test_Category === 'Pathology' ? input.Specimen_Type : null
        test.Imaging_Modality = input.Test_Category === 'Radiology' ? input.Imaging_Modality : null
        test.Unit = input.Unit ?? null

        // Existing order lines keep the price they were booked at; only the
        // descriptive fields follow the catalogue.
        for (const order of draft.orders) {
          for (const line of order.Tests) {
            if (line.Test_ID !== test.Test_ID) continue
            line.Test_Name = test.Test_Name
            line.Test_Category = test.Test_Category
          }
        }
        return test
      })
    },
  },
  {
    method: 'DELETE',
    pattern: '/tests/:id',
    handler: ({ params }) =>
      db.update((draft) => {
        const index = draft.tests.findIndex((row) => row.Test_ID === params.id)
        if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'No test with that ID')

        const usage = draft.orders.filter((order) =>
          order.Tests.some((line) => line.Test_ID === params.id),
        ).length
        if (usage > 0) {
          throw new ApiError(
            409,
            'CONFLICT',
            `This test appears on ${usage} order(s) and cannot be deleted. Historical orders must keep what was booked.`,
          )
        }

        draft.tests.splice(index, 1)
        return { ok: true }
      }),
  },

  {
    method: 'PATCH',
    pattern: '/orders/:id/cancel',
    handler: ({ params }) =>
      db.update((draft) => {
        const order = draft.orders.find((row) => row.Order_ID === params.id)
        if (!order) throw new ApiError(404, 'NOT_FOUND', 'No order with that ID')
        if (order.Status === 'Completed') {
          throw new ApiError(409, 'CONFLICT', 'A completed order cannot be cancelled.')
        }
        order.Status = 'Cancelled'
        return order
      }),
  },
  {
    method: 'DELETE',
    pattern: '/orders/:id',
    handler: ({ params }) =>
      db.update((draft) => {
        const index = draft.orders.findIndex((row) => row.Order_ID === params.id)
        if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'No order with that ID')

        const issued = draft.reports.find(
          (row) => row.Order_ID === params.id && row.Report_Date !== null,
        )
        if (issued) {
          throw new ApiError(
            409,
            'CONFLICT',
            `Report ${issued.Report_ID} has been issued against this order, so it cannot be deleted. Cancel it instead.`,
          )
        }

        // Removing an order takes its samples and any draft report with it.
        draft.samples = draft.samples.filter((row) => row.Order_ID !== params.id)
        draft.reports = draft.reports.filter((row) => row.Order_ID !== params.id)
        draft.orders.splice(index, 1)
        return { ok: true }
      }),
  },

  {
    method: 'PATCH',
    pattern: '/staff/:id',
    handler: ({ params, body }) => {
      const input = requireBody<{
        Staff_Name: string
        Shift: LabStaff['Shift']
        Staff_Role: LabStaff['Staff_Role']
        Certification?: string
        License_No?: string
        Qualification?: string
      }>(body)

      return db.update((draft) => {
        const index = draft.staff.findIndex((row) => row.Staff_ID === params.id)
        if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'No staff member with that ID')
        const existing = draft.staff[index] as LabStaff

        const updated: LabStaff =
          input.Staff_Role === 'Technician'
            ? {
                Staff_ID: existing.Staff_ID,
                Staff_Name: input.Staff_Name,
                Shift: input.Shift,
                Staff_Role: 'Technician',
                Tech_ID: existing.Staff_ID,
                Certification: input.Certification ?? '',
              }
            : {
                Staff_ID: existing.Staff_ID,
                Staff_Name: input.Staff_Name,
                Shift: input.Shift,
                Staff_Role: 'Pathologist',
                Pathologist_ID: existing.Staff_ID,
                License_No: input.License_No ?? '',
                Qualification: input.Qualification ?? '',
              }

        draft.staff[index] = updated

        for (const sample of draft.samples) {
          if (sample.Tech_ID === existing.Staff_ID) sample.Tech_Name = updated.Staff_Name
        }
        for (const report of draft.reports) {
          if (report.Pathologist_ID !== existing.Staff_ID) continue
          report.Pathologist_Name = updated.Staff_Name
          if (updated.Staff_Role === 'Pathologist') {
            report.License_No = updated.License_No
            report.Qualification = updated.Qualification
          }
        }

        return updated
      })
    },
  },
  {
    method: 'DELETE',
    pattern: '/staff/:id',
    handler: ({ params }) =>
      db.update((draft) => {
        const index = draft.staff.findIndex((row) => row.Staff_ID === params.id)
        if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'No staff member with that ID')

        const sampleCount = draft.samples.filter((row) => row.Tech_ID === params.id).length
        const reportCount = draft.reports.filter((row) => row.Pathologist_ID === params.id).length
        if (sampleCount + reportCount > 0) {
          throw new ApiError(
            409,
            'CONFLICT',
            `This staff member is recorded on ${sampleCount} sample(s) and ${reportCount} report(s) and cannot be deleted.`,
          )
        }

        draft.staff.splice(index, 1)
        return { ok: true }
      }),
  },

  {
    method: 'PATCH',
    pattern: '/laboratories/:id',
    handler: ({ params, body }) => {
      const input = requireBody<Omit<Laboratory, 'Lab_ID'>>(body)
      return db.update((draft) => {
        const lab = draft.laboratories.find((row) => row.Lab_ID === params.id)
        if (!lab) throw new ApiError(404, 'NOT_FOUND', 'No laboratory with that ID')

        lab.Lab_Name = input.Lab_Name
        lab.Location = input.Location
        lab.Contact_No = input.Contact_No

        for (const sample of draft.samples) {
          if (sample.Lab_ID === lab.Lab_ID) sample.Lab_Name = lab.Lab_Name
        }
        return lab
      })
    },
  },
  {
    method: 'DELETE',
    pattern: '/laboratories/:id',
    handler: ({ params }) =>
      db.update((draft) => {
        const index = draft.laboratories.findIndex((row) => row.Lab_ID === params.id)
        if (index === -1) throw new ApiError(404, 'NOT_FOUND', 'No laboratory with that ID')

        const sampleCount = draft.samples.filter((row) => row.Lab_ID === params.id).length
        if (sampleCount > 0) {
          throw new ApiError(
            409,
            'CONFLICT',
            `${sampleCount} sample(s) are processed at this laboratory, so it cannot be deleted.`,
          )
        }

        draft.laboratories.splice(index, 1)
        return { ok: true }
      }),
  },

  // ---------- Demo utility ----------
  {
    method: 'POST',
    pattern: '/demo/reset',
    handler: () => {
      db.reset()
      return { ok: true }
    },
  },
]

/** Match a request against the table above. */
export function resolveRoute(method: string, path: string) {
  const segments = path.split('/').filter(Boolean)

  for (const route of routes) {
    if (route.method !== method) continue
    const patternSegments = route.pattern.split('/').filter(Boolean)
    if (patternSegments.length !== segments.length) continue

    const params: Record<string, string> = {}
    let matched = true

    for (let index = 0; index < patternSegments.length; index += 1) {
      const expected = patternSegments[index] as string
      const actual = segments[index] as string
      if (expected.startsWith(':')) {
        params[expected.slice(1)] = decodeURIComponent(actual)
      } else if (expected !== actual) {
        matched = false
        break
      }
    }

    if (matched) return { route, params }
  }

  return null
}
