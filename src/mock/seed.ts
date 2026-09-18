import type {
  Doctor,
  HasResult,
  LabStaff,
  LabTechnician,
  Laboratory,
  OrderIncludesTest,
  OrderStatus,
  Pathologist,
  Patient,
  Remark,
  Report,
  Sample,
  SampleType,
  Test,
  TestOrder,
} from '@/types'
import { SAMPLE_TYPES } from '@/types'
import { TODAY, makeRandom, toIso, toIsoDate } from './rng'

/**
 * Deterministic seed data for every entity in the schema.
 *
 * Volumes are chosen so the UI has real work to do: enough patients to page
 * through, enough orders to fill every status badge, and enough completed
 * reports to exercise the viewer and the print layout.
 */

const FIRST_NAMES_M = [
  'Arjun', 'Rohan', 'Vikram', 'Aditya', 'Karthik',
  'Nikhil', 'Sandeep', 'Rahul', 'Imran', 'Joseph',
]
const FIRST_NAMES_F = [
  'Kavya', 'Meera', 'Ananya', 'Divya', 'Priya',
  'Sneha', 'Lakshmi', 'Fatima', 'Rhea', 'Neha',
]
const LAST_NAMES = [
  'Nair', 'Sharma', 'Reddy', 'Iyer', 'Menon', 'Gupta',
  'Patel', 'Rao', 'Fernandes', 'Krishnan', 'Das', 'Pillai',
]

const SPECIALIZATIONS = [
  'General Medicine',
  'Endocrinology',
  'Cardiology',
  'Nephrology',
  'Paediatrics',
  'Orthopaedics',
  'Gastroenterology',
]

const QUALIFICATIONS = ['MD (Pathology)', 'MBBS, MD', 'DNB (Pathology)', 'MD, DCP']
const CERTIFICATIONS = ['DMLT', 'BSc MLT', 'Phlebotomy Level II', 'MSc MLT']

interface TestSpec {
  name: string
  category: 'Pathology' | 'Radiology'
  price: number
  specimen?: 'Blood' | 'Serum' | 'Urine' | 'Tissue' | 'Stool' | 'Swab'
  modality?: 'X-Ray' | 'MRI' | 'CT Scan' | 'Ultrasound' | 'Mammography'
  unit?: string
  /** Plausible observed values, drawn from by the seeded reports. */
  values: string[]
}

const TEST_SPECS: TestSpec[] = [
  { name: 'Haemoglobin', category: 'Pathology', price: 180, specimen: 'Blood', unit: 'g/dL', values: ['13.4', '11.2', '15.8', '9.6', '14.1'] },
  { name: 'Total Leucocyte Count', category: 'Pathology', price: 220, specimen: 'Blood', unit: 'cells/uL', values: ['7400', '11800', '5200', '13900'] },
  { name: 'Platelet Count', category: 'Pathology', price: 240, specimen: 'Blood', unit: '/uL', values: ['245000', '132000', '410000'] },
  { name: 'Fasting Blood Glucose', category: 'Pathology', price: 150, specimen: 'Serum', unit: 'mg/dL', values: ['92', '128', '164', '78'] },
  { name: 'HbA1c', category: 'Pathology', price: 520, specimen: 'Blood', unit: '%', values: ['5.4', '6.9', '8.2'] },
  { name: 'Serum Creatinine', category: 'Pathology', price: 260, specimen: 'Serum', unit: 'mg/dL', values: ['0.9', '1.6', '2.4', '0.7'] },
  { name: 'Blood Urea Nitrogen', category: 'Pathology', price: 240, specimen: 'Serum', unit: 'mg/dL', values: ['14', '26', '38'] },
  { name: 'Total Cholesterol', category: 'Pathology', price: 320, specimen: 'Serum', unit: 'mg/dL', values: ['178', '236', '198'] },
  { name: 'Triglycerides', category: 'Pathology', price: 300, specimen: 'Serum', unit: 'mg/dL', values: ['122', '214', '308'] },
  { name: 'TSH', category: 'Pathology', price: 450, specimen: 'Serum', unit: 'uIU/mL', values: ['2.1', '6.8', '0.2'] },
  { name: 'Free T3', category: 'Pathology', price: 480, specimen: 'Serum', unit: 'pg/mL', values: ['3.1', '1.8', '4.6'] },
  { name: 'Free T4', category: 'Pathology', price: 480, specimen: 'Serum', unit: 'ng/dL', values: ['1.2', '0.6', '2.3'] },
  { name: 'Serum Bilirubin (Total)', category: 'Pathology', price: 280, specimen: 'Serum', unit: 'mg/dL', values: ['0.8', '1.9', '3.4'] },
  { name: 'SGPT / ALT', category: 'Pathology', price: 260, specimen: 'Serum', unit: 'U/L', values: ['28', '64', '112'] },
  { name: 'SGOT / AST', category: 'Pathology', price: 260, specimen: 'Serum', unit: 'U/L', values: ['31', '58', '96'] },
  { name: 'Urine Routine Examination', category: 'Pathology', price: 200, specimen: 'Urine', values: ['Clear, no growth', 'Trace protein', 'Pus cells 8-10/hpf'] },
  { name: 'Urine Culture', category: 'Pathology', price: 540, specimen: 'Urine', unit: 'CFU/mL', values: ['<10000', '120000', 'No growth'] },
  { name: 'Stool Occult Blood', category: 'Pathology', price: 220, specimen: 'Stool', values: ['Negative', 'Positive'] },
  { name: 'Throat Swab Culture', category: 'Pathology', price: 480, specimen: 'Swab', values: ['Normal flora', 'Streptococcus pyogenes'] },
  { name: 'Biopsy Histopathology', category: 'Pathology', price: 1850, specimen: 'Tissue', values: ['Benign', 'Atypical cells seen'] },
  { name: 'Chest X-Ray PA View', category: 'Radiology', price: 650, modality: 'X-Ray', values: ['No active lung lesion', 'Right basal haziness'] },
  { name: 'X-Ray Knee AP/Lateral', category: 'Radiology', price: 700, modality: 'X-Ray', values: ['Normal alignment', 'Joint space narrowing'] },
  { name: 'MRI Brain Plain', category: 'Radiology', price: 6800, modality: 'MRI', values: ['No acute infarct', 'Small vessel ischaemia'] },
  { name: 'MRI Lumbar Spine', category: 'Radiology', price: 7200, modality: 'MRI', values: ['L4-L5 disc bulge', 'No canal stenosis'] },
  { name: 'CT Abdomen Contrast', category: 'Radiology', price: 5400, modality: 'CT Scan', values: ['Unremarkable', 'Hepatic steatosis'] },
  { name: 'CT Chest HRCT', category: 'Radiology', price: 4900, modality: 'CT Scan', values: ['No fibrosis', 'Ground-glass opacities'] },
  { name: 'Ultrasound Abdomen', category: 'Radiology', price: 1200, modality: 'Ultrasound', values: ['Normal study', 'Grade I fatty liver'] },
  { name: 'Screening Mammography', category: 'Radiology', price: 2400, modality: 'Mammography', values: ['BI-RADS 1', 'BI-RADS 2'] },
]

const LAB_SPECS = [
  { name: 'Central Processing Lab', location: 'Residency Road, Bengaluru' },
  { name: 'Northside Collection Centre', location: 'Hebbal, Bengaluru' },
  { name: 'Whitefield Diagnostics Unit', location: 'Whitefield, Bengaluru' },
  { name: 'Jayanagar Imaging Centre', location: 'Jayanagar, Bengaluru' },
]

const pad = (value: number, width: number) => String(value).padStart(width, '0')

const ORDER_COUNT = 96

/** Status cycle applied to recent orders, so every state is represented. */
const RECENT_STATUS_CYCLE = [
  'Pending',
  'Processing',
  'Processing',
  'Completed',
  'Pending',
  'Processing',
  'Completed',
  'Cancelled',
] as const

export interface SeedData {
  doctors: Doctor[]
  tests: Test[]
  laboratories: Laboratory[]
  staff: LabStaff[]
  patients: Patient[]
  orders: TestOrder[]
  samples: Sample[]
  reports: Report[]
}

export function buildSeed(): SeedData {
  const random = makeRandom()

  // --- Doctors ------------------------------------------------------------
  const doctors: Doctor[] = SPECIALIZATIONS.map((specialization, index) => {
    const first = random.pick(random.chance(0.45) ? FIRST_NAMES_F : FIRST_NAMES_M)
    return {
      Doctor_ID: `D${pad(index + 1, 3)}`,
      Doctor_Name: `Dr. ${first} ${random.pick(LAST_NAMES)}`,
      Specialization: specialization,
    }
  })

  // --- Tests --------------------------------------------------------------
  const tests: Test[] = TEST_SPECS.map((spec, index) => ({
    Test_ID: `T${pad(index + 1, 3)}`,
    Test_Name: spec.name,
    Test_Category: spec.category,
    Price: spec.price,
    Specimen_Type: spec.specimen ?? null,
    Imaging_Modality: spec.modality ?? null,
    Unit: spec.unit ?? null,
  }))

  const specByTestId = new Map<string, TestSpec>(
    tests.map((test, index) => [test.Test_ID, TEST_SPECS[index] as TestSpec]),
  )

  // --- Laboratories -------------------------------------------------------
  const laboratories: Laboratory[] = LAB_SPECS.map((spec, index) => ({
    Lab_ID: `L${pad(index + 1, 2)}`,
    Lab_Name: spec.name,
    Location: spec.location,
    Contact_No: `98${random.int(10000000, 99999999)}`,
  }))

  // --- Staff: an ISA hierarchy of technicians and pathologists ------------
  const staff: LabStaff[] = []

  for (let index = 0; index < 8; index += 1) {
    const staffId = `ST${pad(index + 1, 3)}`
    const name = `${random.pick(random.chance(0.5) ? FIRST_NAMES_F : FIRST_NAMES_M)} ${random.pick(LAST_NAMES)}`
    const technician: LabTechnician = {
      Staff_ID: staffId,
      Staff_Name: name,
      Shift: random.pick(['Morning', 'Evening', 'Night', 'General'] as const),
      Staff_Role: 'Technician',
      Tech_ID: staffId,
      Certification: random.pick(CERTIFICATIONS),
    }
    staff.push(technician)
  }

  for (let index = 0; index < 4; index += 1) {
    const staffId = `ST${pad(index + 9, 3)}`
    const name = `Dr. ${random.pick(random.chance(0.5) ? FIRST_NAMES_F : FIRST_NAMES_M)} ${random.pick(LAST_NAMES)}`
    const pathologist: Pathologist = {
      Staff_ID: staffId,
      Staff_Name: name,
      Shift: random.pick(['Morning', 'Evening', 'General'] as const),
      Staff_Role: 'Pathologist',
      Pathologist_ID: staffId,
      License_No: `KA/MC/${random.int(10000, 99999)}`,
      Qualification: random.pick(QUALIFICATIONS),
    }
    staff.push(pathologist)
  }

  const technicians = staff.filter(
    (member): member is LabTechnician => member.Staff_Role === 'Technician',
  )
  const pathologists = staff.filter(
    (member): member is Pathologist => member.Staff_Role === 'Pathologist',
  )

  // --- Patients -----------------------------------------------------------
  const patients: Patient[] = []
  for (let index = 0; index < 48; index += 1) {
    const patientId = `P${pad(index + 1, 4)}`
    const genderRoll = random.next()
    const gender = genderRoll < 0.48 ? 'M' : genderRoll < 0.97 ? 'F' : 'O'
    const first = random.pick(gender === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F)

    const dob = new Date(TODAY)
    dob.setFullYear(dob.getFullYear() - random.int(2, 78))
    dob.setMonth(random.int(0, 11), random.int(1, 28))

    // Roughly a third of patients keep a second number on file.
    const contactCount = random.chance(0.3) ? 2 : 1
    const contacts = Array.from({ length: contactCount }, () => ({
      Patient_ID: patientId,
      Contact_No: `${random.pick([6, 7, 8, 9])}${random.int(100000000, 999999999)}`,
    }))

    patients.push({
      Patient_ID: patientId,
      First_Name: first,
      Last_Name: random.pick(LAST_NAMES),
      DOB: toIsoDate(dob),
      Gender: gender,
      Contacts: contacts,
    })
  }

  // --- Orders, samples and reports ---------------------------------------
  const orders: TestOrder[] = []
  const samples: Sample[] = []
  const reports: Report[] = []

  let reportCounter = 0

  for (let index = 0; index < ORDER_COUNT; index += 1) {
    const orderId = `O${pad(index + 1, 4)}`
    const patient = random.pick(patients)
    const patientName = `${patient.First_Name} ${patient.Last_Name}`
    const doctor = random.pick(doctors)
    // Spread orders evenly across the last 120 days rather than drawing the
    // age at random: a random age correlates with the status roll further
    // down the same PRNG stream, which produced a demo with no Processing
    // orders at all and therefore an empty pathologist queue.
    const daysAgo = Math.floor((index * 121) / ORDER_COUNT)
    const orderDate = random.dateDaysAgo(daysAgo, random.int(8, 17))

    const chosenTests = random.sample(tests, random.int(1, 5))
    const orderTests: OrderIncludesTest[] = chosenTests.map((test) => ({
      Order_ID: orderId,
      Test_ID: test.Test_ID,
      Test_Name: test.Test_Name,
      Test_Category: test.Test_Category,
      Price: test.Price,
    }))
    const totalPrice = orderTests.reduce((sum, line) => sum + line.Price, 0)

    /**
     * Older orders are finished; recent ones are still moving through the
     * pipeline. Recent statuses follow a fixed cycle rather than a random
     * roll, so the demo is guaranteed to show all four states and to leave
     * work sitting in the pathologist's queue.
     */
    const status: OrderStatus =
      daysAgo <= 21
        ? (RECENT_STATUS_CYCLE[index % RECENT_STATUS_CYCLE.length] as OrderStatus)
        : index % 13 === 0
          ? 'Cancelled'
          : 'Completed'

    orders.push({
      Order_ID: orderId,
      Order_Date: toIsoDate(orderDate),
      Patient_ID: patient.Patient_ID,
      Patient_Name: patientName,
      Doctor_ID: doctor.Doctor_ID,
      Doctor_Name: doctor.Doctor_Name,
      Specialization: doctor.Specialization,
      Status: status,
      Tests: orderTests,
      Total_Price: totalPrice,
    })

    // Nothing was drawn for an order still pending, or one that was withdrawn.
    if (status === 'Pending' || status === 'Cancelled') continue

    // One tube per distinct specimen the order's pathology tests call for.
    const specimenTypes = new Set<SampleType>()
    for (const test of chosenTests) {
      if (test.Test_Category !== 'Pathology') continue
      const mapped = test.Specimen_Type === 'Blood' ? 'Whole Blood' : test.Specimen_Type
      if (mapped && (SAMPLE_TYPES as readonly string[]).includes(mapped)) {
        specimenTypes.add(mapped as SampleType)
      }
    }
    // A radiology-only order still logs one intake record.
    if (specimenTypes.size === 0) specimenTypes.add('Whole Blood')

    const lab = random.pick(laboratories)
    const technician = random.pick(technicians)
    const collectionTime = new Date(orderDate)
    collectionTime.setHours(collectionTime.getHours() + random.int(1, 6))

    let sampleIndex = 0
    for (const sampleType of specimenTypes) {
      sampleIndex += 1
      samples.push({
        Sample_No: `S${sampleIndex}`,
        Order_ID: orderId,
        Patient_ID: patient.Patient_ID,
        Patient_Name: patientName,
        Sample_Type: sampleType,
        Collection_DateTime: toIso(collectionTime),
        Lab_ID: lab.Lab_ID,
        Lab_Name: lab.Lab_Name,
        Tech_ID: technician.Tech_ID,
        Tech_Name: technician.Staff_Name,
        Status:
          status === 'Completed'
            ? 'Received'
            : random.pick(['Collected', 'In Transit', 'Received'] as const),
      })
    }

    /**
     * A draft Report row is created as soon as the samples are in, so the
     * pathologist's entry screen has a Report_ID to display before any value
     * is typed. It stays a draft (no results, no Report_Date) until saved.
     */
    reportCounter += 1
    const reportId = `R${pad(reportCounter, 4)}`
    const pathologist = random.pick(pathologists)
    const reportDate = new Date(collectionTime)
    reportDate.setHours(reportDate.getHours() + random.int(4, 48))
    const isIssued = status === 'Completed'

    const results: HasResult[] = !isIssued ? [] : chosenTests.map((test) => {
      const spec = specByTestId.get(test.Test_ID)
      const remarkRoll = random.next()
      const remark: Remark =
        remarkRoll < 0.68 ? 'Normal' : remarkRoll < 0.92 ? 'Elevated' : 'Critical'
      return {
        Report_ID: reportId,
        Test_ID: test.Test_ID,
        Test_Name: test.Test_Name,
        Test_Category: test.Test_Category,
        Observed_Value: spec ? random.pick(spec.values) : '-',
        Unit: test.Unit,
        Remark: remark,
      }
    })

    reports.push({
      Report_ID: reportId,
      Order_ID: orderId,
      Report_Date: isIssued ? toIso(reportDate) : null,
      Patient_ID: patient.Patient_ID,
      First_Name: patient.First_Name,
      Last_Name: patient.Last_Name,
      DOB: patient.DOB,
      Gender: patient.Gender,
      Doctor_ID: doctor.Doctor_ID,
      Doctor_Name: doctor.Doctor_Name,
      Specialization: doctor.Specialization,
      Pathologist_ID: pathologist.Pathologist_ID,
      Pathologist_Name: pathologist.Staff_Name,
      Qualification: pathologist.Qualification,
      License_No: pathologist.License_No,
      Order_Date: toIsoDate(orderDate),
      Results: results,
    })
  }

  return { doctors, tests, laboratories, staff, patients, orders, samples, reports }
}
