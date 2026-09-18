import { useAuth } from './useAuth'

/**
 * Record-level scoping for patient sessions.
 *
 * Route permissions decide which screens a role may open. This decides which
 * records a patient may see on them, so changing the ID in a report or order
 * URL cannot reveal another patient's data in the UI.
 *
 * The API must enforce the same rule. This check is the interface layer only.
 */
export function usePatientScope() {
  const { session } = useAuth()
  const ownPatientId = session?.user.role === 'patient' ? (session.user.patientId ?? '') : null

  return {
    ownPatientId,
    canView: (recordPatientId: string) => ownPatientId === null || recordPatientId === ownPatientId,
  }
}
