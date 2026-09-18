const express = require('express');
const { body } = require('express-validator');
const laboratoryController = require('../controllers/laboratoryController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const laboratoryValidation = [
  body('Lab_Name')
    .trim()
    .notEmpty()
    .withMessage('Lab name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Lab name must be between 2 and 100 characters'),
  body('Location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('Contact_No')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian contact number'),
  handleValidationErrors,
];

router.get('/', laboratoryController.getLaboratories);
router.get('/:id', laboratoryController.getLaboratoryById);
router.post('/', laboratoryValidation, laboratoryController.createLaboratory);
router.patch('/:id', laboratoryController.updateLaboratory);
router.delete('/:id', laboratoryController.deleteLaboratory);

module.exports = router;

