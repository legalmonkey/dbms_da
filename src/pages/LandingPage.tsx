import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowDown,
  Brain,
  Building2,
  ChevronRight,
  Droplet,
  FlaskConical,
  LogIn,
  MapPin,
  Microscope,
  Phone,
  Radio,
  Scan,
  ShieldCheck,
  Waves,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ROLE_HOME } from '@/app/navigation'
import AeroShards from '@/components/landing/AeroShards'
import { AeroShardsCanvas } from '@/components/landing/AeroShardsCanvas'
import { ChromaGrid } from '@/components/landing/ChromaGrid'
import { LoginModal } from '@/components/landing/LoginModal'
import { SemiCircleCarousel } from '@/components/landing/SemiCircleCarousel'
import { useAuth } from '@/hooks/useAuth'
import { getLabLocations } from '@/services/adminService'
import type { Role, SessionUser } from '@/types'

export function LandingPage() {
  const { session, loginAs } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [activeDivision, setActiveDivision] = useState<'pathology' | 'radiology'>('pathology')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('hematology')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Fade out background and pop up corner specimen after scrolling past hero
      setIsScrolled(window.scrollY > 160)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Query laboratory locations from Oracle database
  const { data: labs = [] } = useQuery({
    queryKey: ['laboratories', 'landing-labs'],
    queryFn: () => getLabLocations(),
  })

  // Set once the GPU renderer reports it cannot run, which swaps the
  // background to the Canvas 2D field.
  const [gpuFailed, setGpuFailed] = useState(false)
  const handleGpuError = useCallback((error: Error) => {
    console.warn('AeroShards GPU renderer unavailable, using the canvas field:', error.message)
    setGpuFailed(true)
  }, [])

  if (session) {
    return <Navigate to={from ?? ROLE_HOME[session.user.role] ?? '/dashboard'} replace />
  }

  const signIn = (role: Role, userOverride?: Partial<SessionUser>) => {
    loginAs(role, userOverride)
    navigate(from ?? ROLE_HOME[role] ?? '/dashboard', { replace: true })
  }

  return (
    <div className="landing-root flex min-h-screen flex-col">
      {/*
        Background stack (fixed to viewport):
        - On hero: Wide, full-bleed 3D RBC stream across the screen.
        - On scroll: The stream focuses and narrows (spread: 0.3), flowing in the
          exact same direction and animation, but occupying a narrower, focused channel
          so it doesn't cover the entire screen, ensuring high contrast and clarity.
      */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {gpuFailed ? (
          <>
            <ChromaGrid />
            <AeroShardsCanvas
              shardColor="#D92638"
              accentColor="#FF3355"
              backgroundColor="#0B070A"
              shardSize={1.1}
              speed={1}
              spin={1}
              density={isScrolled ? 1.1 : 1.5}
              spread={isScrolled ? 0.3 : 1}
              depth={1}
              interaction="repel"
              holdToGather
            />
          </>
        ) : (
          <AeroShards
            backgroundColor="#0B070A"
            shardColor="#D92638"
            accentColor="#FF3355"
            placement="full"
            flow="stream"
            material="pearl"
            detail="balanced"
            effect="none"
            scale={1}
            spread={isScrolled ? 0.3 : 1}
            depth={1}
            speed={1}
            spin={1}
            interaction="repel"
            density={isScrolled ? 1.2 : 1.5}
            shardSize={1.1}
            stretch={1}
            turbulence={1}
            glow={1}
            edgeSoftness={2}
            bloom={0.5}
            grain={0.05}
            chromaticAberration={0.0075}
            transitionDuration={1}
            interactionRadius={1.5}
            interactionStrength={0.5}
            rippleIntensity={1}
            holdToGather
            onError={handleGpuError}
          />
        )}
      </div>

      {/* Sticky Top Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-rose-900/30 bg-[#0b070a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center">
            <div>
              <span className="landing-title-font text-sm font-bold tracking-tight text-white block">
                MERIDIAN
              </span>
              <span className="text-[10px] tracking-wider uppercase text-rose-300/80 block font-medium">
                Diagnostics LIS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="#services"
              className="text-xs font-semibold text-[var(--landing-ink-soft)] transition-colors hover:text-white"
            >
              Services We Offer
            </a>
            <a
              href="#centres"
              className="text-xs font-semibold text-[var(--landing-ink-soft)] transition-colors hover:text-white"
            >
              Centres
            </a>

            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-900/40 transition-all hover:from-rose-500 hover:to-red-500 hover:shadow-rose-800/60 hover:scale-[1.02]"
            >
              <LogIn className="size-3.5" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        id="main-content"
        className="relative z-10 mx-auto flex w-full max-w-5xl min-h-[calc(100vh-65px)] flex-col justify-center px-5 py-16 sm:px-8"
      >
        <header className="max-w-3xl">
          <h1 className="landing-title-font text-balance text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <span className="block drop-shadow-[0_4px_30px_rgba(255,255,255,0.18)]">
              Meridian Diagnostics
            </span>
            <span className="mt-2.5 block text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.18)] sm:text-3xl lg:text-4xl">
              Laboratory Information System
            </span>
          </h1>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-rose-900/50 transition-all hover:from-rose-500 hover:to-red-500 hover:scale-105"
            >
              <LogIn className="size-5" />
              <span>Login to Portal</span>
            </button>

            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/30"
            >
              <span>Explore Services We Offer</span>
              <ArrowDown className="size-4 animate-bounce" />
            </a>
          </div>

          {/* Key Metrics / Trust Bar */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
            <div>
              <span className="text-2xl font-black text-white block">20+</span>
              <span className="text-xs text-[var(--landing-ink-muted)]">Clinical Tests & Scans</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">4</span>
              <span className="text-xs text-[var(--landing-ink-muted)]">Regional Lab Centres</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">Digital</span>
              <span className="text-xs text-[var(--landing-ink-muted)]">Instant Report Access</span>
            </div>
          </div>
        </header>
      </main>

      {/* Services We Offer Section (Clean overview according to database, without individual test names/prices) */}
      <section id="services" className="relative z-10 w-full px-5 py-20 sm:px-8 max-w-6xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="landing-title-font text-3xl font-black tracking-tight text-white sm:text-5xl">
            Services We Offer
          </h2>

          <p className="mt-4 text-base leading-relaxed text-[var(--landing-ink-soft)] sm:text-lg">
            Adhering to international NABL and AERB standards, Meridian Diagnostics delivers precision
            diagnostic testing across specialized pathology and advanced medical imaging.
          </p>
        </div>

        {/* Division Switcher */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-2xl border border-white/15 bg-black/60 p-1.5 backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveDivision('pathology')
                setSelectedDisciplineId('hematology')
              }}
              className={`flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold transition-all cursor-pointer ${
                activeDivision === 'pathology'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/80 scale-[1.02]'
                  : 'text-[var(--landing-ink-soft)] hover:text-white hover:bg-white/5'
              }`}
            >
              <FlaskConical className="size-4" />
              <span>Pathology & Lab Medicine</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveDivision('radiology')
                setSelectedDisciplineId('mri')
              }}
              className={`flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold transition-all cursor-pointer ${
                activeDivision === 'radiology'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/80 scale-[1.02]'
                  : 'text-[var(--landing-ink-soft)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Radio className="size-4" />
              <span>Radiology & Medical Imaging</span>
            </button>
          </div>
        </div>

        {/* Dynamic Division Bento Station */}
        {(() => {
          const pathologyDisciplines = [
            {
              id: 'hematology',
              title: 'Hematology & Hemostasis',
              icon: Droplet,
              tags: ['Hb', 'TLC Differential', 'Platelets', 'PCV / Indices'],
              shortDesc: 'Complete blood counts, cell morphology, erythrocyte indices, and bleeding risk evaluations.',
              method: 'Automated 5-Part Laser Flow Cytometry',
              statTime: 'STAT < 2 Hours',
              specimen: '3.0 mL K2-EDTA Whole Blood',
              analyzer: 'Automated 5-Part Differential Hematology Platform',
              clinicalUtility: 'Anemia stratification, systemic infection monitoring, and thrombocytopenic bleeding risk evaluation.',
              qcStandard: 'ICSH Reference Standard & Daily Tri-Level Westgard QC',
            },
            {
              id: 'glycemic',
              title: 'Glycemic & Diabetes Care',
              icon: Activity,
              tags: ['Fasting Glucose', 'HbA1c (Gold Std)', 'eAG', 'Post-Prandial'],
              shortDesc: 'Basal glucose monitoring, oral tolerance assessment, and longitudinal 3-month glycemic stability.',
              method: 'Standardized Cation-Exchange HPLC',
              statTime: 'Same Day (< 4h)',
              specimen: 'Fluoride Oxalate Plasma & EDTA Whole Blood',
              analyzer: 'High-Performance Liquid Chromatography (HPLC) System',
              clinicalUtility: 'Long-term 90-day glycemic trend tracking, diabetic retinopathy risk mitigation, and prediabetes detection.',
              qcStandard: 'NGSP & IFCC Standardized Reference Method',
            },
            {
              id: 'renal_hepatic',
              title: 'Renal & Hepatic Function',
              icon: ShieldCheck,
              tags: ['Serum Creatinine', 'eGFR', 'SGPT / ALT', 'Bilirubin'],
              shortDesc: 'Glomerular filtration rate, nitrogenous clearance, transaminases, and liver enzyme integrity.',
              method: 'Multi-Channel Photometric Kinetic Rate',
              statTime: 'Routine < 4 Hours',
              specimen: 'Clot Activator Serum (Centrifuged 3500 RPM)',
              analyzer: 'High-Throughput Discrete Chemistry Analyzer',
              clinicalUtility: 'Early nephropathy screening, medication toxicity titration, and acute hepatitis assessment.',
              qcStandard: 'Multi-Point Calibration with Bio-Rad Liquichek Controls',
            },
            {
              id: 'microbiology',
              title: 'Endocrine & Microbiology',
              icon: Microscope,
              tags: ['TSH CLIA Assay', 'Urinalysis', 'Bacterial Culture', 'Antibiogram'],
              shortDesc: 'Thyroid metabolic regulation, urinary sediment microscopy, and antimicrobial susceptibility.',
              method: 'Chemiluminescence Immunoassay (CLIA)',
              statTime: 'TSH: 4h • Culture: 48-72h',
              specimen: 'Serum & Sterile Universal Swab Containers',
              analyzer: 'Paramagnetic Microparticle CLIA & Bio-Incubator Station',
              clinicalUtility: 'Hypo/hyperthyroidism diagnosis, bacteremia identification, and targeted antibiotic therapy selection.',
              qcStandard: 'CLSI M100 Antimicrobial Susceptibility Guidelines',
            },
          ]

          const radiologyDisciplines = [
            {
              id: 'mri',
              title: 'Magnetic Resonance (MRI)',
              icon: Brain,
              tags: ['Brain Plain / Contrast', 'Lumbar Spine', 'T1/T2 Axial', 'MR Angio'],
              shortDesc: 'High-contrast soft tissue neuro-imaging for cerebral ischemia, spinal disc disease, and cord nerves.',
              method: 'High-Field Superconducting Resonance',
              statTime: 'Scan: 20m • Report: < 6h',
              specimen: '32-Channel High-Density RF Coils',
              analyzer: 'High-Field Superconducting MRI Scanner',
              clinicalUtility: 'Acute ischemic stroke delineation, spinal herniation, disc extrusion, and intracranial lesion characterization.',
              qcStandard: 'AERB Certified RF-Shielded Suite & DICOM 3.0 Tele-PACS',
            },
            {
              id: 'ct_scan',
              title: 'Computed Tomography (CT)',
              icon: Scan,
              tags: ['Abdomen Contrast', 'Helical 3D', 'Chest High-Res', 'Visceral Beds'],
              shortDesc: 'Rapid multi-slice volumetric imaging with intravenous contrast for solid abdominal organs and vessels.',
              method: 'Multi-Detector Helical Volumetric',
              statTime: 'Scan: 10m • Report: STAT < 3h',
              specimen: 'Automated Dual-Head Contrast Injector',
              analyzer: '64-Slice Sub-Millimeter CT Gantry',
              clinicalUtility: 'Visceral organ trauma, pulmonary embolism detection, appendicitis, and oncologic staging.',
              qcStandard: 'AERB Low-Radiation AEC Protocol & PACS Archiving',
            },
            {
              id: 'xray',
              title: 'Digital Radiography (X-Ray)',
              icon: Zap,
              tags: ['Chest PA View', 'Knee AP/Lateral', 'Orthopaedic', 'Sinus Series'],
              shortDesc: 'Ultra-low radiation flat-panel digital radiography for pulmonary fields and joint osteopathology.',
              method: 'Direct Cesium Iodide (CsI) Sensor',
              statTime: 'Instant Scan • Report: < 2h',
              specimen: 'High-Frequency Digital DR Detector',
              analyzer: 'Direct Digital Radiography (DR) Flat-Panel Suite',
              clinicalUtility: 'Pneumonia consolidation screening, cardiomegaly evaluation, fracture exclusion, and arthritic changes.',
              qcStandard: 'ALARA Radiation Dose Minimization Protocol',
            },
            {
              id: 'ultrasound',
              title: 'Diagnostic Ultrasonography',
              icon: Waves,
              tags: ['Abdomen & Pelvis', 'Hepatobiliary', 'Renal Doppler', 'Soft Tissue'],
              shortDesc: 'Dynamic high-frequency acoustic echo imaging for hepatobiliary, renal, splenic, and pelvic anatomy.',
              method: 'Real-Time High-Frequency Acoustic Echo',
              statTime: 'Real-Time 15m Exam',
              specimen: 'Broadband Convex & Linear Probes',
              analyzer: 'Color Doppler High-Resolution Sonography Station',
              clinicalUtility: 'Cholelithiasis gallstones, nephrolithiasis renal calculi, hepatic steatosis, and vascular velocities.',
              qcStandard: '100% Non-Ionizing Safe Acoustic Imaging',
            },
          ]

          const activeList = activeDivision === 'pathology' ? pathologyDisciplines : radiologyDisciplines
          const currentSelected = activeList.find((d) => d.id === selectedDisciplineId) ?? activeList[0]!

          return (
            <div className="mt-10 space-y-6">
              {/* Division Command Banner */}
              <div className="glass-surface rounded-2xl p-6 sm:p-8 border border-rose-500/25 bg-gradient-to-r from-rose-950/40 via-[#12080d]/80 to-black/70">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h3 className="landing-title-font text-2xl font-black text-white sm:text-3xl">
                      {activeDivision === 'pathology'
                        ? 'Pathology & Laboratory Medicine'
                        : 'Radiology & Medical Imaging'}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--landing-ink-soft)] max-w-2xl leading-relaxed">
                      {activeDivision === 'pathology'
                        ? 'Automated clinical chemistry analyzers, 5-part hematology counters, and chemiluminescent immunoassays processing barcoded specimens under continuous internal QC.'
                        : 'Equipped with high-field magnetic resonance, multi-slice helical contrast computed tomography, and ultra-low-dose digital flat-panel radiography reviewed by specialist radiologists.'}
                    </p>
                  </div>

                  {/* Flow Chips */}
                  <div className="flex flex-wrap gap-2 lg:max-w-xs">
                    {(activeDivision === 'pathology'
                      ? ['Whole Blood (EDTA)', 'Serum / Plasma', 'Sterile Urine', 'Bacterial Swabs']
                      : ['1.5T / 3.0T MRI', 'Helical Contrast CT', 'Digital X-Ray', 'High-Res USG']
                    ).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/50 px-3 py-1.5 text-xs font-semibold text-rose-200 backdrop-blur-sm"
                      >
                        {activeDivision === 'pathology' ? (
                          <Droplet className="size-3 text-rose-400" />
                        ) : (
                          <Radio className="size-3 text-rose-400" />
                        )}
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3D Semi-Circle Carousel for Disciplines / Modalities */}
              <SemiCircleCarousel
                items={activeList}
                activeIndex={Math.max(0, activeList.findIndex((d) => d.id === currentSelected.id))}
                onChangeIndex={(index) => {
                  const target = activeList[index]
                  if (target) {
                    setSelectedDisciplineId(target.id)
                  }
                }}
              />
            </div>
          )
        })()}

        {/* Interactive Specimen & Scan Lifecycle Track (Something New & Fresh!) */}
        <div className="mt-14 glass-surface rounded-2xl p-6 sm:p-8 border border-white/10">
          <h4 className="text-lg font-bold text-white">
            How Meridian LIS Processes Every Diagnostic Request
          </h4>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Accession & Barcoding',
                desc: 'Every specimen and scan request is assigned an immutable SQL barcode ID with cold-chain provenance.',
              },
              {
                step: '02',
                title: 'High-Precision Analysis',
                desc: 'Specimens run on calibrated analyzers; imaging DICOM files stream to our picture archive station.',
              },
              {
                step: '03',
                title: 'Specialist Sign-Off',
                desc: 'Licensed Pathologists and Radiologists review observations, reference intervals, and clinical flags.',
              },
              {
                step: '04',
                title: 'Encrypted Portal Delivery',
                desc: 'Final reports are published immediately to the patient and ordering doctor with digital tamper-proofing.',
              },
            ].map((stage, idx) => (
              <div key={stage.step} className="relative rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-rose-500/30 hover:bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-400">{stage.step}</span>
                  {idx < 3 && <ChevronRight className="size-4 text-white/20 hidden lg:block" />}
                </div>
                <h5 className="mt-2 text-sm font-bold text-white">{stage.title}</h5>
                <p className="mt-1 text-xs text-[var(--landing-ink-muted)] leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Laboratory Locations Section */}
        <div id="centres" className="mt-20 border-t border-white/10 pt-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold text-[var(--landing-ink-soft)]">
              <Building2 className="size-3.5 text-rose-400" />
              <span>OUR REGIONAL CENTRES</span>
            </div>
            <h3 className="landing-title-font mt-3 text-2xl font-black text-white sm:text-4xl">
              Diagnostic Centres & Collection Hubs
            </h3>
            <p className="mt-2 text-sm text-[var(--landing-ink-soft)]">
              Accredited sample intake facilities and imaging suites strategically located across the city.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {labs.map((lab) => (
              <div key={lab.Lab_ID} className="glass-surface rounded-xl p-5 border border-white/10">
                <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-400">
                  <MapPin className="size-4" />
                </div>
                <h5 className="mt-3 text-sm font-bold text-white">{lab.Lab_Name}</h5>
                <p className="mt-1 text-xs text-[var(--landing-ink-soft)]">{lab.Location}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-mono text-rose-300 border-t border-white/10 pt-3">
                  <Phone className="size-3" />
                  <span>+91 {lab.Contact_No}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 glass-surface rounded-2xl p-8 sm:p-10 border border-rose-500/25 bg-gradient-to-r from-rose-950/40 via-black/50 to-slate-900/40 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h4 className="landing-title-font text-2xl font-black text-white">
              Ready to book a test or access your health record?
            </h4>
            <p className="mt-1 text-sm text-[var(--landing-ink-soft)] max-w-xl">
              Sign in as a patient to browse our full diagnostic catalogue with real-time pricing and place orders online.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="landing-cta-btn inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black shadow-xl shadow-white/10 transition-all hover:bg-zinc-100 hover:scale-105 flex-shrink-0 cursor-pointer"
            style={{ color: '#0b070a', backgroundColor: '#ffffff' }}
          >
            <span style={{ color: '#0b070a' }}>Login to Portal</span>
            <ChevronRight className="size-4" style={{ color: '#0b070a' }} />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 pt-8 pb-12 text-center text-xs text-[var(--landing-ink-muted)]">
          <p>© 2026 Meridian Diagnostics Laboratory Information System (LIS). All rights reserved.</p>
          <p className="mt-1">
            NABL ISO 15189 Accredited • AERB Certified Radiology • Real-time Oracle SQL Engine
          </p>
        </footer>
      </section>

      {/* Role Login Modal (Opened via Login button) */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSelectRole={signIn}
      />
    </div>
  )
}



