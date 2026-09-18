import type { Remark } from '@/types'

export type ParameterInputType = 'numeric' | 'qualitative' | 'radiology_impression'

export interface QuickOption {
  label: string
  value: string
  remark: Remark
}

export interface EvaluationResult {
  remark: Remark
  statusText: string
  isOutOfRange: boolean
  tone: 'success' | 'warning' | 'critical'
}

export interface TestParameterConfig {
  testId: string
  testName: string
  category: 'Pathology' | 'Radiology'
  inputType: ParameterInputType
  defaultUnit: string
  unitLocked?: boolean
  referenceDisplay: string
  guidance?: string
  placeholder: string
  quickOptions?: QuickOption[]
  evaluate?: (value: string | number) => EvaluationResult
}

const TEST_CONFIG_MAP: Record<string, TestParameterConfig> = {
  T001: {
    testId: 'T001',
    testName: 'Haemoglobin',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'g/dL',
    referenceDisplay: '13.0 – 17.0 g/dL',
    guidance: 'Adult reference: 13.0 to 17.0 g/dL (M) / 12.0 to 15.5 g/dL (F)',
    placeholder: 'e.g. 14.2',
    quickOptions: [
      { label: 'Normal (14.5)', value: '14.5', remark: 'Normal' },
      { label: 'Mild Anemia (11.2)', value: '11.2', remark: 'Elevated' },
      { label: 'Severe Anemia (7.8)', value: '7.8', remark: 'Critical' },
      { label: 'Polycythemia (18.5)', value: '18.5', remark: 'Elevated' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num < 8.0) return { remark: 'Critical', statusText: 'Critically low (< 8.0)', isOutOfRange: true, tone: 'critical' }
      if (num < 13.0) return { remark: 'Elevated', statusText: 'Below normal range (< 13.0)', isOutOfRange: true, tone: 'warning' }
      if (num > 18.0) return { remark: 'Critical', statusText: 'Critically elevated (> 18.0)', isOutOfRange: true, tone: 'critical' }
      if (num > 17.0) return { remark: 'Elevated', statusText: 'Above normal range (> 17.0)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (13.0 – 17.0)', isOutOfRange: false, tone: 'success' }
    },
  },
  T002: {
    testId: 'T002',
    testName: 'Total Leucocyte Count',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: '/µL',
    referenceDisplay: '4,000 – 11,000 /µL',
    guidance: 'WBC count: 4,000 to 11,000 cells/µL',
    placeholder: 'e.g. 7200',
    quickOptions: [
      { label: 'Normal (6,800)', value: '6800', remark: 'Normal' },
      { label: 'Leukopenia (3,100)', value: '3100', remark: 'Elevated' },
      { label: 'Leukocytosis (14,500)', value: '14500', remark: 'Elevated' },
      { label: 'Severe (24,000)', value: '24000', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num < 2000) return { remark: 'Critical', statusText: 'Severe leukopenia (< 2000)', isOutOfRange: true, tone: 'critical' }
      if (num < 4000) return { remark: 'Elevated', statusText: 'Low WBC (< 4000)', isOutOfRange: true, tone: 'warning' }
      if (num > 20000) return { remark: 'Critical', statusText: 'Marked leukocytosis (> 20000)', isOutOfRange: true, tone: 'critical' }
      if (num > 11000) return { remark: 'Elevated', statusText: 'Elevated WBC (> 11000)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (4,000 – 11,000)', isOutOfRange: false, tone: 'success' }
    },
  },
  T003: {
    testId: 'T003',
    testName: 'Platelet Count',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: '10^3/µL',
    referenceDisplay: '150 – 450 10^3/µL',
    guidance: 'Normal platelet count: 150,000 to 450,000 /µL',
    placeholder: 'e.g. 240',
    quickOptions: [
      { label: 'Normal (250)', value: '250', remark: 'Normal' },
      { label: 'Thrombocytopenia (95)', value: '95', remark: 'Elevated' },
      { label: 'Severe Low (30)', value: '30', remark: 'Critical' },
      { label: 'Thrombocytosis (520)', value: '520', remark: 'Elevated' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num < 50) return { remark: 'Critical', statusText: 'Critical thrombocytopenia (< 50)', isOutOfRange: true, tone: 'critical' }
      if (num < 150) return { remark: 'Elevated', statusText: 'Low platelets (< 150)', isOutOfRange: true, tone: 'warning' }
      if (num > 600) return { remark: 'Critical', statusText: 'Severe thrombocytosis (> 600)', isOutOfRange: true, tone: 'critical' }
      if (num > 450) return { remark: 'Elevated', statusText: 'High platelets (> 450)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (150 – 450)', isOutOfRange: false, tone: 'success' }
    },
  },
  T004: {
    testId: 'T004',
    testName: 'Fasting Blood Glucose',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'mg/dL',
    referenceDisplay: '70 – 100 mg/dL',
    guidance: 'Normal: 70–100 mg/dL; Impaired: 101–125 mg/dL; Diabetic: >= 126 mg/dL',
    placeholder: 'e.g. 92',
    quickOptions: [
      { label: 'Normal (88)', value: '88', remark: 'Normal' },
      { label: 'Impaired (115)', value: '115', remark: 'Elevated' },
      { label: 'Diabetic (165)', value: '165', remark: 'Elevated' },
      { label: 'Severe Hyper (280)', value: '280', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num < 50) return { remark: 'Critical', statusText: 'Critical hypoglycemia (< 50)', isOutOfRange: true, tone: 'critical' }
      if (num < 70) return { remark: 'Elevated', statusText: 'Mild hypoglycemia (< 70)', isOutOfRange: true, tone: 'warning' }
      if (num >= 250) return { remark: 'Critical', statusText: 'Critical hyperglycemia (>= 250)', isOutOfRange: true, tone: 'critical' }
      if (num > 100) return { remark: 'Elevated', statusText: 'Elevated glucose (> 100)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (70 – 100)', isOutOfRange: false, tone: 'success' }
    },
  },
  T005: {
    testId: 'T005',
    testName: 'HbA1c',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: '%',
    referenceDisplay: '< 5.7 %',
    guidance: 'Normal: < 5.7%; Prediabetes: 5.7–6.4%; Diabetes: >= 6.5%',
    placeholder: 'e.g. 5.4',
    quickOptions: [
      { label: 'Normal (5.2)', value: '5.2', remark: 'Normal' },
      { label: 'Prediabetes (6.1)', value: '6.1', remark: 'Elevated' },
      { label: 'Diabetic (7.4)', value: '7.4', remark: 'Elevated' },
      { label: 'Poor Control (10.2)', value: '10.2', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 9.0) return { remark: 'Critical', statusText: 'Poor glycemic control (>= 9.0)', isOutOfRange: true, tone: 'critical' }
      if (num >= 5.7) return { remark: 'Elevated', statusText: 'Elevated / Diabetic (>= 5.7)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (< 5.7)', isOutOfRange: false, tone: 'success' }
    },
  },
  T006: {
    testId: 'T006',
    testName: 'Serum Creatinine',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'mg/dL',
    referenceDisplay: '0.7 – 1.3 mg/dL',
    guidance: 'Normal renal function: 0.7 to 1.3 mg/dL',
    placeholder: 'e.g. 0.9',
    quickOptions: [
      { label: 'Normal (1.0)', value: '1.0', remark: 'Normal' },
      { label: 'Mild Impairment (1.6)', value: '1.6', remark: 'Elevated' },
      { label: 'Moderate Renal (2.4)', value: '2.4', remark: 'Elevated' },
      { label: 'Severe Renal (4.2)', value: '4.2', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 3.5) return { remark: 'Critical', statusText: 'Critical renal impairment (>= 3.5)', isOutOfRange: true, tone: 'critical' }
      if (num > 1.3) return { remark: 'Elevated', statusText: 'Elevated creatinine (> 1.3)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (0.7 – 1.3)', isOutOfRange: false, tone: 'success' }
    },
  },
  T007: {
    testId: 'T007',
    testName: 'Blood Urea Nitrogen',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'mg/dL',
    referenceDisplay: '7 – 20 mg/dL',
    guidance: 'Normal range: 7 to 20 mg/dL',
    placeholder: 'e.g. 14',
    quickOptions: [
      { label: 'Normal (14)', value: '14', remark: 'Normal' },
      { label: 'Borderline (24)', value: '24', remark: 'Elevated' },
      { label: 'High (36)', value: '36', remark: 'Elevated' },
      { label: 'Severe Azotemia (65)', value: '65', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 50) return { remark: 'Critical', statusText: 'Severe azotemia (>= 50)', isOutOfRange: true, tone: 'critical' }
      if (num > 20) return { remark: 'Elevated', statusText: 'Elevated BUN (> 20)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (7 – 20)', isOutOfRange: false, tone: 'success' }
    },
  },
  T008: {
    testId: 'T008',
    testName: 'Total Cholesterol',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'mg/dL',
    referenceDisplay: '< 200 mg/dL',
    guidance: 'Desirable: < 200 mg/dL; Borderline: 200–239 mg/dL; High: >= 240 mg/dL',
    placeholder: 'e.g. 175',
    quickOptions: [
      { label: 'Desirable (172)', value: '172', remark: 'Normal' },
      { label: 'Borderline (215)', value: '215', remark: 'Elevated' },
      { label: 'High (255)', value: '255', remark: 'Elevated' },
      { label: 'Severe (320)', value: '320', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 300) return { remark: 'Critical', statusText: 'Severe hypercholesterolemia (>= 300)', isOutOfRange: true, tone: 'critical' }
      if (num >= 200) return { remark: 'Elevated', statusText: 'Borderline/High (>= 200)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Desirable (< 200)', isOutOfRange: false, tone: 'success' }
    },
  },
  T009: {
    testId: 'T009',
    testName: 'Triglycerides',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'mg/dL',
    referenceDisplay: '< 150 mg/dL',
    guidance: 'Normal: < 150 mg/dL; Borderline: 150–199 mg/dL; High: 200–499 mg/dL',
    placeholder: 'e.g. 120',
    quickOptions: [
      { label: 'Normal (110)', value: '110', remark: 'Normal' },
      { label: 'Borderline (175)', value: '175', remark: 'Elevated' },
      { label: 'High (260)', value: '260', remark: 'Elevated' },
      { label: 'Very High (540)', value: '540', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 500) return { remark: 'Critical', statusText: 'Very high risk pancreatitis (>= 500)', isOutOfRange: true, tone: 'critical' }
      if (num >= 150) return { remark: 'Elevated', statusText: 'Elevated triglycerides (>= 150)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (< 150)', isOutOfRange: false, tone: 'success' }
    },
  },
  T010: {
    testId: 'T010',
    testName: 'TSH',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'µIU/mL',
    referenceDisplay: '0.4 – 4.0 µIU/mL',
    guidance: 'Euthyroid range: 0.40 to 4.00 µIU/mL',
    placeholder: 'e.g. 2.15',
    quickOptions: [
      { label: 'Euthyroid (2.4)', value: '2.4', remark: 'Normal' },
      { label: 'Subclinical Hypo (6.5)', value: '6.5', remark: 'Elevated' },
      { label: 'Overt Hypo (18.2)', value: '18.2', remark: 'Critical' },
      { label: 'Hyperthyroid (0.05)', value: '0.05', remark: 'Elevated' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 15.0 || num < 0.05) return { remark: 'Critical', statusText: 'Marked thyroid dysfunction', isOutOfRange: true, tone: 'critical' }
      if (num > 4.0 || num < 0.4) return { remark: 'Elevated', statusText: 'Outside euthyroid range', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (0.4 – 4.0)', isOutOfRange: false, tone: 'success' }
    },
  },
  T011: {
    testId: 'T011',
    testName: 'Serum Bilirubin (Total)',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'mg/dL',
    referenceDisplay: '0.2 – 1.2 mg/dL',
    guidance: 'Normal adult total bilirubin: 0.2 to 1.2 mg/dL',
    placeholder: 'e.g. 0.8',
    quickOptions: [
      { label: 'Normal (0.7)', value: '0.7', remark: 'Normal' },
      { label: 'Mild Jaundice (1.8)', value: '1.8', remark: 'Elevated' },
      { label: 'Moderate Jaundice (3.5)', value: '3.5', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 3.0) return { remark: 'Critical', statusText: 'Clinical jaundice (>= 3.0)', isOutOfRange: true, tone: 'critical' }
      if (num > 1.2) return { remark: 'Elevated', statusText: 'Elevated bilirubin (> 1.2)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (0.2 – 1.2)', isOutOfRange: false, tone: 'success' }
    },
  },
  T012: {
    testId: 'T012',
    testName: 'SGPT / ALT',
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: 'U/L',
    referenceDisplay: '7 – 56 U/L',
    guidance: 'Normal hepatic transaminase: 7 to 56 U/L',
    placeholder: 'e.g. 26',
    quickOptions: [
      { label: 'Normal (28)', value: '28', remark: 'Normal' },
      { label: 'Mild Hepatitis (85)', value: '85', remark: 'Elevated' },
      { label: 'Acute Liver Injury (340)', value: '340', remark: 'Critical' },
    ],
    evaluate: (val) => {
      const num = Number(val)
      if (isNaN(num)) return { remark: 'Normal', statusText: '', isOutOfRange: false, tone: 'success' }
      if (num >= 250) return { remark: 'Critical', statusText: 'Acute hepatocellular injury (>= 250)', isOutOfRange: true, tone: 'critical' }
      if (num > 56) return { remark: 'Elevated', statusText: 'Elevated ALT/SGPT (> 56)', isOutOfRange: true, tone: 'warning' }
      return { remark: 'Normal', statusText: 'Normal (7 – 56)', isOutOfRange: false, tone: 'success' }
    },
  },
  T013: {
    testId: 'T013',
    testName: 'Urine Routine Examination',
    category: 'Pathology',
    inputType: 'qualitative',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Pale Yellow, Clear, pH 6.0, Prot: Nil',
    guidance: 'Normal appearance: pale yellow, clear. Negative for protein, glucose, blood.',
    placeholder: 'Enter urine analysis findings',
    quickOptions: [
      { label: 'Normal / Clear', value: 'Normal / Clear (Prot: Nil, Sugar: Nil)', remark: 'Normal' },
      { label: 'Trace Protein', value: 'Pale yellow, Trace Protein (+)', remark: 'Elevated' },
      { label: 'Microscopic RBCs', value: 'Turbid, Microscopic RBCs 10-15/hpf', remark: 'Elevated' },
      { label: 'Active UTI (Pus Cells)', value: 'Cloudy, Pus cells > 30/hpf (UTI)', remark: 'Critical' },
    ],
  },
  T014: {
    testId: 'T014',
    testName: 'Throat Swab Culture',
    category: 'Pathology',
    inputType: 'qualitative',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'No pathogenic bacterial growth (48h)',
    guidance: 'Aerobic swab culture incubated at 37°C for 48 hours',
    placeholder: 'Enter microbial isolate findings',
    quickOptions: [
      { label: 'No pathogenic growth', value: 'No pathogenic bacterial growth', remark: 'Normal' },
      { label: 'Normal Flora', value: 'Normal commensal upper respiratory flora', remark: 'Normal' },
      { label: 'Strep pyogenes (+)', value: 'Streptococcus pyogenes (Group A) isolated', remark: 'Elevated' },
      { label: 'Candida albicans (+)', value: 'Candida albicans detected in heavy growth', remark: 'Elevated' },
    ],
  },
  T015: {
    testId: 'T015',
    testName: 'Chest X-Ray PA View',
    category: 'Radiology',
    inputType: 'radiology_impression',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Normal lungs, clear angles, CTR < 0.50',
    guidance: 'Modality: Plain Radiography (X-Ray). Max 50 characters for DB record.',
    placeholder: 'Radiologist impression (max 50 chars)',
    quickOptions: [
      { label: 'Clear / Unremarkable', value: 'Clear lung fields; normal cardiac contour', remark: 'Normal' },
      { label: 'No acute cardiopulmonary', value: 'No focal consolidation, effusion or pneumothorax', remark: 'Normal' },
      { label: 'Bronchovascular Markings', value: 'Mild bilateral bronchovascular prominence', remark: 'Elevated' },
      { label: 'Cardiomegaly / Effusion', value: 'Cardiomegaly with bilateral pleural effusion', remark: 'Critical' },
    ],
  },
  T016: {
    testId: 'T016',
    testName: 'X-Ray Knee AP/Lateral',
    category: 'Radiology',
    inputType: 'radiology_impression',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Preserved joint spaces, intact bone cortex',
    guidance: 'Modality: Plain Radiography (X-Ray). Max 50 characters.',
    placeholder: 'Radiologist impression (max 50 chars)',
    quickOptions: [
      { label: 'Normal knee joints', value: 'Preserved joint spaces; no fracture or lesion', remark: 'Normal' },
      { label: 'Mild OA / Narrowing', value: 'Mild medial compartment joint space narrowing', remark: 'Elevated' },
      { label: 'Osteophytes', value: 'Degenerative marginal osteophytes noted', remark: 'Elevated' },
      { label: 'Fracture / Effusion', value: 'Cortical fracture with tense joint effusion', remark: 'Critical' },
    ],
  },
  T017: {
    testId: 'T017',
    testName: 'MRI Brain Plain',
    category: 'Radiology',
    inputType: 'radiology_impression',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Normal parenchyma, age-appropriate sulci',
    guidance: 'Modality: MRI. Max 50 characters.',
    placeholder: 'Neuroradiologist impression (max 50 chars)',
    quickOptions: [
      { label: 'Normal Brain Study', value: 'Normal gray-white differentiation; sulci clear', remark: 'Normal' },
      { label: 'No Acute Infarct', value: 'No acute territorial infarct or hemorrhage', remark: 'Normal' },
      { label: 'Mild Ischemia', value: 'Age-related mild periventricular ischemic changes', remark: 'Elevated' },
      { label: 'Acute Infarct / Mass', value: 'Acute infarct with mass effect & midline shift', remark: 'Critical' },
    ],
  },
  T018: {
    testId: 'T018',
    testName: 'MRI Lumbar Spine',
    category: 'Radiology',
    inputType: 'radiology_impression',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Normal spinal curvature, discs intact',
    guidance: 'Modality: MRI. Max 50 characters.',
    placeholder: 'Spine radiologist impression (max 50 chars)',
    quickOptions: [
      { label: 'Normal Lumbar Spine', value: 'Normal spinal curvature; intact disc heights', remark: 'Normal' },
      { label: 'L4-L5 Disc Bulge', value: 'L4-L5 disc bulge with mild thecal indentation', remark: 'Elevated' },
      { label: 'L5-S1 Foraminal Stenosis', value: 'L5-S1 disc protrusion; bilateral stenosis', remark: 'Elevated' },
      { label: 'Cord / Cauda Equina', value: 'Severe spinal canal stenosis with cord impingement', remark: 'Critical' },
    ],
  },
  T019: {
    testId: 'T019',
    testName: 'CT Abdomen Contrast',
    category: 'Radiology',
    inputType: 'radiology_impression',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Normal visceral enhancement, no free fluid',
    guidance: 'Modality: CT Scan. Max 50 characters.',
    placeholder: 'CT radiologist impression (max 50 chars)',
    quickOptions: [
      { label: 'Normal Abdominal CT', value: 'Abdominal viscera unremarkable; no free fluid', remark: 'Normal' },
      { label: 'No Focal Mass / Stone', value: 'No focal mass, lymphadenopathy or calculus', remark: 'Normal' },
      { label: 'Mild Fatty Liver', value: 'Mild hepatic steatosis; kidneys normal', remark: 'Elevated' },
      { label: 'Acute Peritonitis', value: 'Bowel perforation with pneumoperitoneum', remark: 'Critical' },
    ],
  },
  T020: {
    testId: 'T020',
    testName: 'Ultrasound Abdomen',
    category: 'Radiology',
    inputType: 'radiology_impression',
    defaultUnit: '',
    unitLocked: true,
    referenceDisplay: 'Normal echo-texture, no calculi or dilation',
    guidance: 'Modality: Ultrasound. Max 50 characters.',
    placeholder: 'Sonologist impression (max 50 chars)',
    quickOptions: [
      { label: 'Normal Ultrasound', value: 'Normal liver, gallbladder, spleen and kidneys', remark: 'Normal' },
      { label: 'Grade 1 Fatty Liver', value: 'Grade 1 diffuse hepatic steatosis (fatty liver)', remark: 'Elevated' },
      { label: 'Cholelithiasis', value: 'Gallbladder calculi with acoustic shadowing', remark: 'Elevated' },
      { label: 'Acute Cholecystitis', value: 'Gallbladder wall thickening with pericholecystic fluid', remark: 'Critical' },
    ],
  },
}

/**
 * Returns parameter configuration for a given test, with smart fallback for unknown/custom tests.
 */
export function getTestParameterConfig(
  testId: string,
  testName = '',
  category: 'Pathology' | 'Radiology' = 'Pathology'
): TestParameterConfig {
  const existing = TEST_CONFIG_MAP[testId]
  if (existing) {
    return existing
  }

  // Fallback for custom or newly added tests
  if (category === 'Radiology') {
    return {
      testId,
      testName,
      category: 'Radiology',
      inputType: 'radiology_impression',
      defaultUnit: '',
      unitLocked: true,
      referenceDisplay: 'Normal anatomical & imaging appearance',
      guidance: 'Modality: Radiology. Max 50 characters.',
      placeholder: 'Enter clinical findings (max 50 chars)',
      quickOptions: [
        { label: 'Normal / Unremarkable', value: 'No acute abnormality detected; normal appearance', remark: 'Normal' },
        { label: 'Abnormal Finding', value: 'Abnormal findings noted; correlate clinically', remark: 'Elevated' },
      ],
    }
  }

  return {
    testId,
    testName,
    category: 'Pathology',
    inputType: 'numeric',
    defaultUnit: '',
    referenceDisplay: 'Reference range per laboratory protocol',
    placeholder: 'Enter observed value',
    quickOptions: [
      { label: 'Normal Finding', value: 'Normal / Negative', remark: 'Normal' },
      { label: 'Elevated Finding', value: 'Elevated / Positive', remark: 'Elevated' },
    ],
  }
}
