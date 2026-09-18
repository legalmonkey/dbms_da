const express = require('express');
const { body, param } = require('express-validator');
const patientController = require('../controllers/patientController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const patientValidation = [
  body('First_Name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 60 })
    .withMessage('First name cannot exceed 60 characters'),
  body('Last_Name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 60 })
    .withMessage('Last name cannot exceed 60 characters'),
  body('DOB')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),
  body('Gender')
    .isIn(['M', 'F', 'O'])
    .withMessage('Gender must be M, F, or O'),
  body('Contacts')
    .optional()
    .isArray()
    .withMessage('Contacts must be an array of phone numbers')
    .custom((contacts) => {
      if (contacts && contacts.length > 0) {
        for (const c of contacts) {
          const num = typeof c === 'string' ? c : c.Contact_No;
          if (!num || !/^[6-9]\d{9}$/.test(String(num).trim())) {
            throw new Error('Enter a valid 10-digit Indian mobile number');
          }
        }
      }
      return true;
    }),
  handleValidationErrors,
];

router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', patientValidation, patientController.createPatient);
router.patch('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

module.exports = router;

