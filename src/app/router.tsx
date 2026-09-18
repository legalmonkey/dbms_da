import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { StyleGuidePage } from '@/pages/StyleGuidePage'
import { AdminWorkspacePage } from '@/pages/workspace/AdminWorkspacePage'
import { PathologistWorkspacePage } from '@/pages/workspace/PathologistWorkspacePage'
import { PatientWorkspacePage } from '@/pages/workspace/PatientWorkspacePage'
import { TechnicianWorkspacePage } from '@/pages/workspace/TechnicianWorkspacePage'
import { PatientsPage } from '@/pages/PatientsPage'
import { PatientRegisterPage } from '@/pages/PatientRegisterPage'
import { PatientProfilePage } from '@/pages/PatientProfilePage'
import { CataloguePage } from '@/pages/CataloguePage'
import { OrdersPage } from '@/pages/OrdersPage'
import { OrderBookingPage } from '@/pages/OrderBookingPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { SampleIntakePage } from '@/pages/SampleIntakePage'
import { ResultQueuePage } from '@/pages/ResultQueuePage'
import { ResultEntryPage } from '@/pages/ResultEntryPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ReportViewPage } from '@/pages/ReportViewPage'
import { ReportPrintPage } from '@/pages/ReportPrintPage'
import { StaffDirectoryPage } from '@/pages/StaffDirectoryPage'
import { LaboratoriesPage } from '@/pages/LaboratoriesPage'
import { RequireAuth, RequirePermission, RequireRole } from './guards'
import { RoleLanding } from './RoleLanding'
import type { Permission } from '@/types'

/** Wraps a screen in the permission required to open it. */
function guarded(permission: Permission, element: React.ReactNode) {
  return <RequirePermission permission={permission}>{element}</RequirePermission>
}

/**
 * Routes are grouped by the five project modules:
 *   1. Patient           - registration, profile, catalogue, order booking
 *   2. Lab Technician    - sample collection and intake
 *   3. Pathologist       - pending queue and result entry
 *   4. Report Viewer     - clinical report and print layout
 *   5. Administration    - test catalogue, staff and laboratories
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LandingPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleLanding /> },

      // --- Role workspaces: where each role lands after selection ----------
      { path: 'admin', element: guarded('staff:manage', <AdminWorkspacePage />) },
      {
        path: 'patient',
        element: (
          <RequireRole roles={['patient']}>
            <PatientWorkspacePage />
          </RequireRole>
        ),
      },
      { path: 'lab-tech', element: guarded('sample:write', <TechnicianWorkspacePage />) },
      { path: 'pathologist', element: guarded('report:write', <PathologistWorkspacePage />) },

      // Earlier links pointed here; send them to the right workspace.
      { path: 'dashboard', element: <RoleLanding /> },

      // --- Module 1: Patient ---------------------------------------------
      { path: 'patients', element: guarded('patient:read', <PatientsPage />) },
      { path: 'patients/new', element: guarded('patient:write', <PatientRegisterPage />) },
      { path: 'patients/:patientId', element: guarded('patient:read', <PatientProfilePage />) },

      { path: 'catalogue', element: guarded('catalogue:read', <CataloguePage />) },

      { path: 'orders', element: guarded('order:read', <OrdersPage />) },
      { path: 'orders/new', element: guarded('order:create', <OrderBookingPage />) },
      { path: 'orders/:orderId', element: guarded('order:read', <OrderDetailPage />) },

      // --- Module 2: Lab Technician ---------------------------------------
      { path: 'samples', element: guarded('sample:read', <SampleIntakePage />) },

      // --- Module 3: Pathologist ------------------------------------------
      { path: 'results', element: guarded('report:write', <ResultQueuePage />) },
      { path: 'results/:reportId', element: guarded('report:write', <ResultEntryPage />) },

      // --- Module 4: Report viewer ----------------------------------------
      { path: 'reports', element: guarded('report:read', <ReportsPage />) },
      { path: 'reports/:reportId', element: guarded('report:read', <ReportViewPage />) },

      // --- Module 5: Administration ---------------------------------------
      { path: 'admin/staff', element: guarded('staff:manage', <StaffDirectoryPage />) },
      { path: 'admin/labs', element: guarded('staff:manage', <LaboratoriesPage />) },

      // Component reference for developers. Not shipped in production builds.
      ...(import.meta.env.DEV ? [{ path: 'design-system', element: <StyleGuidePage /> }] : []),
      { path: '403', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  /**
   * The print view lives outside the app shell: no sidebar, no top bar, just
   * the report on an A4 page.
   */
  {
    path: '/reports/:reportId/print',
    element: (
      <RequireAuth>
        <ReportPrintPage />
      </RequireAuth>
    ),
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
