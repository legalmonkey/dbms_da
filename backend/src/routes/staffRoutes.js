const express = require('express');
const { body } = require('express-validator');
const staffController = require('../controllers/staffController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const staffValidation = [
  body('Staff_Name')
    .trim()
    .notEmpty()
    .withMessage('Staff name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Staff name must be between 2 and 100 characters'),
  body('Shift')
    .isIn(['Morning', 'Evening', 'Night', 'General'])
    .withMessage('Shift must be Morning, Evening, Night, or General'),
  body('Staff_Role')
    .isIn(['Technician', 'Pathologist'])
    .withMessage('Staff role must be Technician or Pathologist'),
  body('Certification')
    .optional()
    .custom((value, { req }) => {
      if (req.body.Staff_Role === 'Technician' && (!value || !value.trim())) {
        throw new Error('Certification is required for a lab technician');
      }
      return true;
    }),
  body('License_No')
    .optional()
    .custom((value, { req }) => {
      if (req.body.Staff_Role === 'Pathologist' && (!value || !value.trim())) {
        throw new Error('License number is required for a pathologist');
      }
      return true;
    }),
  body('Qualification')
    .optional()
    .custom((value, { req }) => {
      if (req.body.Staff_Role === 'Pathologist' && (!value || !value.trim())) {
        throw new Error('Qualification is required for a pathologist');
      }
      return true;
    }),
  handleValidationErrors,
];

router.get('/', staffController.getStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', staffValidation, staffController.createStaff);
router.patch('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;

