import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Loader2,
  Microscope,
  Phone,
  PlusCircle,
  Search,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'
import { type ComponentType, useEffect, useState } from 'react'
import { Spotlight } from '@/components/landing/Spotlight'
import { formatAge, formatDate, initials } from '@/lib/format'
import { createPatient, getPatients } from '@/services/patientService'
import { getStaff } from '@/services/adminService'
import {
  GENDER_LABELS,
  ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  isPathologist,
  isTechnician,
  type Gender,
  type Role,
  type SessionUser,
} from '@/types'

const ROLE_ICONS: Record<Role, ComponentType<{ className?: string }>> = {
  admin: UserCog,
  patient: UserRound,
  technician: FlaskConical,
  pathologist: Microscope,
}

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectRole: (role: Role, userOverride?: Partial<SessionUser>) => void
}

export function LoginModal({ isOpen, onClose, onSelectRole }: LoginModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [patientTab, setPatientTab] = useState<'signin' | 'signup'>('signin')
  const [searchQuery, setSearchQuery] = useState('')

  // New patient signup state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<Gender>('F')
  const [contactNo, setContactNo] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Reset state when closed or opened
  useEffect(() => {
    if (!isOpen) {
      setSelectedRole(null)
      setPatientTab('signin')
      setSearchQuery('')
      setFormError(null)
    }
  }, [isOpen])

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRole) {
          setSelectedRole(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedRole, onClose])

  // Queries for dynamic profile lists from Oracle DB
  const patientsQuery = useQuery({
    queryKey: ['login-patients'],
    queryFn: () => getPatients({ pageSize: 50 }),
    enabled: isOpen && selectedRole === 'patient' && patientTab === 'signin',
  })

  const techniciansQuery = useQuery({
    queryKey: ['login-technicians'],
    queryFn: () => getStaff({ role: 'Technician' }),
    enabled: isOpen && selectedRole === 'technician',
  })

  const pathologistsQuery = useQuery({
    queryKey: ['login-pathologists'],
    queryFn: () => getStaff({ role: 'Pathologist' }),
    enabled: isOpen && selectedRole === 'pathologist',
  })

  // Patient Registration Mutation
  const createPatientMutation = useMutation({
    mutationFn: () => {
      if (!firstName.trim()) throw new Error('First name is required')
      if (!lastName.trim()) throw new Error('Last name is required')
      if (!dob) throw new Error('Date of birth is required')
      if (!contactNo.trim()) throw new Error('Phone number is required')

      return createPatient(
        {
          First_Name: firstName.trim(),
          Last_Name: lastName.trim(),
          DOB: dob,
          Gender: gender,
        },
        [{ Contact_No: contactNo.trim() }]
      )
    },
    onSuccess: (newPatient) => {
      onSelectRole('patient', {
        id: `usr-pat-${newPatient.Patient_ID}`,
        name: `${newPatient.First_Name} ${newPatient.Last_Name}`,
        patientId: newPatient.Patient_ID,
        designation: `Patient ID: ${newPatient.Patient_ID}`,
      })
      onClose()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : String(err))
    },
  })

  if (!isOpen) return null

  // Filtered lists based on search
  const q = searchQuery.trim().toLowerCase()

  const filteredPatients = (patientsQuery.data?.data ?? []).filter((p) => {
    if (!q) return true
    const fullName = `${p.First_Name} ${p.Last_Name}`.toLowerCase()
    return fullName.includes(q) || p.Patient_ID.toLowerCase().includes(q)
  })

  const filteredTechnicians = (techniciansQuery.data ?? [])
    .filter(isTechnician)
    .filter((t) => {
      if (!q) return true
      return (
        t.Staff_Name.toLowerCase().includes(q) ||
        t.Staff_ID.toLowerCase().includes(q) ||
        t.Certification.toLowerCase().includes(q)
      )
    })

  const filteredPathologists = (pathologistsQuery.data ?? [])
    .filter(isPathologist)
    .filter((p) => {
      if (!q) return true
      return (
        p.Staff_Name.toLowerCase().includes(q) ||
        p.Staff_ID.toLowerCase().includes(q) ||
        p.License_No.toLowerCase().includes(q)
      )
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B070A] p-6 shadow-2xl sm:p-8 overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="flex items-start gap-3">
            {selectedRole && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null)
                  setSearchQuery('')
                  setFormError(null)
                }}
                className="mt-1 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Back to roles"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/40 px-3 py-0.5 text-xs font-semibold text-rose-300">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                {selectedRole ? ROLE_LABELS[selectedRole].toUpperCase() : 'PORTAL ACCESS'}
              </span>
              <h2
                id="login-modal-title"
                className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                {selectedRole === 'patient'
                  ? 'Patient Portal Access'
                  : selectedRole === 'technician'
                  ? 'Select Lab Technician Profile'
                  : selectedRole === 'pathologist'
                  ? 'Select Pathologist Profile'
                  : 'Sign In to Meridian Diagnostics'}
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                {selectedRole === 'patient'
                  ? 'Sign in to an existing patient account or create a new profile.'
                  : selectedRole === 'technician'
                  ? 'Choose your technician profile to record sample collection and intake.'
                  : selectedRole === 'pathologist'
                  ? 'Choose your consultant profile to review findings and authorize reports.'
                  : 'Select your role to access your dedicated clinical workspace and records.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stone-400 hover:bg-white/15 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* -------------------- STEP 1: INITIAL 4 ROLES -------------------- */}
        {!selectedRole && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role]
              return (
                <div key={role} className="h-full">
                  <Spotlight className="h-full rounded-xl" color="rgb(225 29 72 / 0.25)">
                    <button
                      type="button"
                      onClick={() => {
                        if (role === 'admin') {
                          onSelectRole('admin')
                          onClose()
                        } else {
                          setSelectedRole(role)
                          setSearchQuery('')
                        }
                      }}
                      className="flex h-full w-full flex-col rounded-xl border border-white/10 bg-[#140D13] p-5 text-left transition-all hover:border-rose-500/50 hover:bg-[#1A1019] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10">
                        <Icon className="size-5 text-rose-400" />
                      </span>

                      <span className="mt-4 text-base font-bold text-white">
                        {ROLE_LABELS[role]}
                      </span>

                      <span className="mt-1.5 flex-1 text-xs leading-relaxed text-stone-400">
                        {ROLE_DESCRIPTIONS[role]}
                      </span>

                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                        Enter as {ROLE_LABELS[role]}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    </button>
                  </Spotlight>
                </div>
              )
            })}
          </div>
        )}

        {/* -------------------- STEP 2: PATIENT VIEW (SIGN IN / SIGN UP) -------------------- */}
        {selectedRole === 'patient' && (
          <div className="mt-6 flex flex-col gap-5">
            {/* Tabs for Sign In vs Sign Up */}
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setPatientTab('signin')
                  setFormError(null)
                }}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  patientTab === 'signin'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <UserCheck className="size-4" />
                Sign In (Existing Patient)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPatientTab('signup')
                  setFormError(null)
                }}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  patientTab === 'signup'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <UserPlus className="size-4" />
                New Patient Sign Up
              </button>
            </div>

            {/* TAB 1: Existing Patient Sign In */}
            {patientTab === 'signin' && (
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by patient name or ID (e.g. Kavya, P0001)..."
                    className="w-full rounded-lg border border-white/10 bg-[#160E15] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-stone-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Patient List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5 rounded-lg border border-white/10 bg-[#120B11]">
                  {patientsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12 text-stone-400 gap-2 text-sm">
                      <Loader2 className="size-4 animate-spin text-rose-500" />
                      Loading registered patients from database...
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="py-10 text-center text-sm text-stone-500">
                      No matching patients found in database.
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <button
                        key={p.Patient_ID}
                        type="button"
                        onClick={() => {
                          onSelectRole('patient', {
                            id: `usr-pat-${p.Patient_ID}`,
                            name: `${p.First_Name} ${p.Last_Name}`,
                            patientId: p.Patient_ID,
                            designation: `Patient ID: ${p.Patient_ID}`,
                          })
                          onClose()
                        }}
                        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#1C101B] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-rose-950/70 border border-rose-500/30 text-xs font-bold text-rose-300">
                            {initials(`${p.First_Name} ${p.Last_Name}`)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                                {p.First_Name} {p.Last_Name}
                              </span>
                              <span className="font-mono text-2xs text-rose-400 bg-rose-950/40 border border-rose-500/20 px-1.5 py-0.5 rounded">
                                {p.Patient_ID}
                              </span>
                            </div>
                            <div className="text-2xs text-stone-400 mt-0.5 flex items-center gap-2">
                              <span>{GENDER_LABELS[p.Gender]}</span>
                              <span>·</span>
                              <span>{formatAge(p.DOB)}</span>
                              <span>·</span>
                              <span>DOB: {formatDate(p.DOB)}</span>
                              {p.Contacts && p.Contacts.length > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="size-2.5" />
                                    {p.Contacts[0]?.Contact_No}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-rose-400 transition-colors">
                          Enter
                          <ArrowRight className="size-3.5" />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: New Patient Sign Up Form */}
            {patientTab === 'signup' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createPatientMutation.mutate()
                }}
                className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#140D13] p-5"
              >
                {formError && (
                  <div className="p-3 text-xs rounded-md bg-rose-950/50 border border-rose-500/40 text-rose-300">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Ramesh"
                      className="w-full rounded-lg border border-white/10 bg-[#1B111A] px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Rao"
                      className="w-full rounded-lg border border-white/10 bg-[#1B111A] px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#1B111A] px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['F', 'M', 'O'] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            gender === g
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-[#1B111A] text-stone-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {GENDER_LABELS[g]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                    Primary Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="e.g. 9845012345 (10 digits)"
                    className="w-full rounded-lg border border-white/10 bg-[#1B111A] px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {createPatientMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Registering in Oracle DB...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="size-4" />
                        Register & Enter Portal
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* -------------------- STEP 3: LAB TECHNICIAN PROFILE SELECTION -------------------- */}
        {selectedRole === 'technician' && (
          <div className="mt-6 flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search technician by name, shift, or ID (e.g. Rahul, ST001)..."
                className="w-full rounded-lg border border-white/10 bg-[#160E15] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-stone-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Technicians List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 rounded-lg border border-white/10 bg-[#120B11]">
              {techniciansQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-stone-400 gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin text-rose-500" />
                  Loading technicians from Oracle DB...
                </div>
              ) : filteredTechnicians.length === 0 ? (
                <div className="py-10 text-center text-sm text-stone-500">
                  No matching technicians found.
                </div>
              ) : (
                filteredTechnicians.map((t) => (
                  <button
                    key={t.Staff_ID}
                    type="button"
                    onClick={() => {
                      onSelectRole('technician', {
                        id: `usr-tech-${t.Staff_ID}`,
                        name: t.Staff_Name,
                        techId: t.Staff_ID,
                        designation: `${t.Certification} · ${t.Shift} Shift`,
                      })
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#1C101B] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-rose-950/70 border border-rose-500/30 text-xs font-bold text-rose-300">
                        {initials(t.Staff_Name)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                            {t.Staff_Name}
                          </span>
                          <span className="font-mono text-2xs text-rose-400 bg-rose-950/40 border border-rose-500/20 px-1.5 py-0.5 rounded">
                            {t.Staff_ID}
                          </span>
                        </div>
                        <div className="text-2xs text-stone-400 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-stone-300">{t.Certification}</span>
                          <span>·</span>
                          <span className="text-rose-400 font-medium">{t.Shift} Shift</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-rose-400 transition-colors">
                      Enter
                      <ArrowRight className="size-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* -------------------- STEP 4: PATHOLOGIST PROFILE SELECTION -------------------- */}
        {selectedRole === 'pathologist' && (
          <div className="mt-6 flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pathologist by name, license, or ID (e.g. Vikram, ST009)..."
                className="w-full rounded-lg border border-white/10 bg-[#160E15] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-stone-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Pathologists List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 rounded-lg border border-white/10 bg-[#120B11]">
              {pathologistsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-stone-400 gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin text-rose-500" />
                  Loading consultant pathologists from Oracle DB...
                </div>
              ) : filteredPathologists.length === 0 ? (
                <div className="py-10 text-center text-sm text-stone-500">
                  No matching pathologists found.
                </div>
              ) : (
                filteredPathologists.map((p) => (
                  <button
                    key={p.Staff_ID}
                    type="button"
                    onClick={() => {
                      onSelectRole('pathologist', {
                        id: `usr-path-${p.Staff_ID}`,
                        name: p.Staff_Name,
                        pathologistId: p.Staff_ID,
                        designation: `${p.Qualification} · ${p.License_No}`,
                      })
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#1C101B] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-rose-950/70 border border-rose-500/30 text-xs font-bold text-rose-300">
                        {initials(p.Staff_Name)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                            {p.Staff_Name}
                          </span>
                          <span className="font-mono text-2xs text-rose-400 bg-rose-950/40 border border-rose-500/20 px-1.5 py-0.5 rounded">
                            {p.Staff_ID}
                          </span>
                        </div>
                        <div className="text-2xs text-stone-400 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-stone-300">{p.Qualification}</span>
                          <span>·</span>
                          <span className="font-mono text-stone-400">Lic: {p.License_No}</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-rose-400 transition-colors">
                      Enter
                      <ArrowRight className="size-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-stone-500">
            {selectedRole
              ? 'Multi-profile clinical credentialing powered by Meridian LIS database.'
              : 'Authenticated sessions are tied to your selected role. Protected by multi-factor clinical access controls.'}
          </p>
        </div>
      </div>
    </div>
  )
}
