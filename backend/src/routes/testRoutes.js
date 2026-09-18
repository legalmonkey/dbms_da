const express = require('express');
const { body } = require('express-validator');
const testController = require('../controllers/testController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const testValidation = [
  body('Test_Name')
    .trim()
    .notEmpty()
    .withMessage('Test name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Test name must be between 2 and 100 characters'),
  body('Test_Category')
    .isIn(['Pathology', 'Radiology'])
    .withMessage('Test category must be Pathology or Radiology'),
  body('Price')
    .isInt({ min: 0 })
    .withMessage('Price must be a non-negative whole number of rupees'),
  body('Specimen_Type')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (req.body.Test_Category === 'Pathology' && !value) {
        throw new Error('Select a specimen type for a pathology test');
      }
      return true;
    }),
  body('Imaging_Modality')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (req.body.Test_Category === 'Radiology' && !value) {
        throw new Error('Select an imaging modality for a radiology test');
      }
      return true;
    }),
  handleValidationErrors,
];

router.get('/', testController.getTests);
router.get('/:id', testController.getTestById);
router.post('/', testValidation, testController.createTest);
router.patch('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);

module.exports = router;

