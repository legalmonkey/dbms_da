import { z } from 'zod'

/**
 * Test, with its two specialisations.
 *
 * Test_Category is the discriminator: a Pathology test carries Specimen_Type
 * (PathologyTest), a Radiology test carries Imaging_Modality (RadiologyTest).
 * The admin catalogue form swaps its conditional input on this field.
 */

export const testCategorySchema = z.enum(['Pathology', 'Radiology'])
export type TestCategory = z.infer<typeof testCategorySchema>

export const TEST_CATEGORIES: TestCategory[] = ['Pathology', 'Radiology']

export const specimenTypeSchema = z.enum(['Blood', 'Serum', 'Urine', 'Tissue', 'Stool', 'Swab'])
export type SpecimenType = z.infer<typeof specimenTypeSchema>
export const SPECIMEN_TYPES: SpecimenType[] = ['Blood', 'Serum', 'Urine', 'Tissue', 'Stool', 'Swab']

export const imagingModalitySchema = z.enum(['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Mammography'])
export type ImagingModality = z.infer<typeof imagingModalitySchema>
export const IMAGING_MODALITIES: ImagingModality[] = [
  'X-Ray',
  'MRI',
  'CT Scan',
  'Ultrasound',
  'Mammography',
]

export interface Test {
  Test_ID: string
  Test_Name: string
  Test_Category: TestCategory
  Price: number
  /** Present when Test_Category is 'Pathology' (PathologyTest). */
  Specimen_Type: SpecimenType | null
  /** Present when Test_Category is 'Radiology' (RadiologyTest). */
  Imaging_Modality: ImagingModality | null
  /** Canonical unit for the observed value, e.g. 'g/dL'. Null for imaging. */
  Unit: string | null
}

/**
 * Payload accepted by createTest. Validated as a discriminated union so that
 * a Pathology test cannot be saved without a specimen, and a Radiology test
 * cannot be saved without a modality.
 */
export const testInputSchema = z
  .object({
    Test_Name: z.string().trim().min(2, 'Test name is required').max(60),
    Test_Category: testCategorySchema,
    Price: z.coerce.number().int('Price must be a whole number of rupees').min(0, 'Price cannot be negative'),
    Specimen_Type: specimenTypeSchema.nullable().optional(),
    Imaging_Modality: imagingModalitySchema.nullable().optional(),
    Unit: z.string().trim().max(16).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.Test_Category === 'Pathology' && !value.Specimen_Type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['Specimen_Type'],
        message: 'Select a specimen type for a pathology test',
      })
    }
    if (value.Test_Category === 'Radiology' && !value.Imaging_Modality) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['Imaging_Modality'],
        message: 'Select an imaging modality for a radiology test',
      })
    }
  })
export type TestInput = z.infer<typeof testInputSchema>

/** What the catalogue grid shows in the sub-label under the test name. */
export const testDetailLabel = (test: Test) =>
  test.Test_Category === 'Pathology' ? test.Specimen_Type : test.Imaging_Modality

export const TEST_DESCRIPTIONS: Record<string, string> = {
  'Haemoglobin': 'Quantifies oxygen-carrying haemoglobin protein to evaluate anaemia, polycythaemia, and oxygen transport capacity.',
  'Total Leucocyte Count': 'Measures overall white blood cell density to evaluate immune status, systemic infection, and inflammatory response.',
  'Platelet Count': 'Evaluates circulating thrombocyte concentration essential for hemostasis, coagulation, and bleeding risk assessment.',
  'Fasting Blood Glucose': 'Determines basal glycemic level after 8-10 hours fasting for pre-diabetes and diabetes mellitus diagnosis.',
  'HbA1c': 'Assesses 3-month average plasma glucose concentration for glycemic management and longitudinal diabetic monitoring.',
  'Serum Creatinine': 'Primary indicator of renal excretory function, glomerular filtration rate (GFR), and kidney integrity.',
  'Blood Urea Nitrogen': 'Biomarker of nitrogen clearance and protein catabolism used in tandem to assess renal and hepatic function.',
  'Total Cholesterol': 'Quantitative estimation of circulating sterols to calculate cardiovascular atherosclerotic risk.',
  'Triglycerides': 'Assesses neutral blood lipid reserves; key marker for dyslipidemia, coronary risk, and pancreatitis.',
  'TSH': 'High-sensitivity thyroid-stimulating hormone assay for diagnosing hypothyroidism, hyperthyroidism, and pituitary balance.',
  'Serum Bilirubin (Total)': 'Assesses hepatic excretory and biliary tract function, differential diagnosis of jaundice, and hemolysis.',
  'SGPT / ALT': 'Key intracellular hepatic enzyme released during hepatocellular injury; primary screening for liver pathology.',
  'Urine Routine Examination': 'Comprehensive physical, chemical, and microscopic examination for renal disorders, glycosuria, and urinary infections.',
  'Throat Swab Culture': 'Microbial isolation and antibiotic susceptibility testing for pharyngeal and upper respiratory bacterial pathogens.',
  'Chest X-Ray PA View': 'Digital chest radiography assessing the pulmonary fields, cardiac silhouette, thoracic wall, and mediastinum.',
  'X-Ray Knee AP/Lateral': 'Orthopaedic digital imaging evaluating articular joint spaces, degenerative joint disease, and skeletal trauma.',
  'MRI Brain Plain': 'High-resolution neuro-imaging without contrast for cerebral parenchymal lesions, ischemia, and cranial nerve pathology.',
  'MRI Lumbar Spine': 'Multi-planar soft tissue imaging for spinal disc herniations, thecal sac compression, and lumbar spondylosis.',
  'CT Abdomen Contrast': 'Cross-sectional helical CT with intravenous contrast for detailed visualization of abdominal organs and vessels.',
  'Ultrasound Abdomen': 'Real-time dynamic acoustic sonography for non-invasive evaluation of hepatobiliary, renal, and abdominal structures.',
}

export function getTestDescription(test: Test): string {
  return (
    TEST_DESCRIPTIONS[test.Test_Name] ||
    (test.Test_Category === 'Pathology'
      ? `Clinical pathology diagnostic assay analyzing ${test.Specimen_Type?.toLowerCase() || 'biological'} specimens.`
      : `Medical imaging scan utilizing high-precision ${test.Imaging_Modality || 'radiological'} modality.`)
  )
}
