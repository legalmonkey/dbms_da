const express = require('express');
const { body } = require('express-validator');
const sampleController = require('../controllers/sampleController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const sampleValidation = [
  body('Order_ID')
    .trim()
    .notEmpty()
    .withMessage('Select an order for sample collection'),
  body('Sample_Type')
    .isIn(['Whole Blood', 'Blood', 'Serum', 'Plasma', 'Urine', 'Stool', 'Tissue', 'Swab'])
    .withMessage('Invalid sample type'),
  body('Lab_ID')
    .trim()
    .notEmpty()
    .withMessage('Select the processing laboratory'),
  body('Tech_ID')
    .trim()
    .notEmpty()
    .withMessage('Select the collecting technician'),
  body('Status')
    .optional()
    .isIn(['Collected', 'In Transit', 'Received', 'Rejected'])
    .withMessage('Invalid sample status'),
  handleValidationErrors,
];

router.get('/', sampleController.getSamples);
router.get('/:id', sampleController.getSampleById);
router.post('/', sampleValidation, sampleController.createSample);

module.exports = router;

