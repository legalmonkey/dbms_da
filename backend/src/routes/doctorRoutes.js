const express = require('express');
const { body } = require('express-validator');
const doctorController = require('../controllers/doctorController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const doctorValidation = [
  body('Doctor_Name')
    .trim()
    .notEmpty()
    .withMessage('Doctor name is required')
    .isLength({ max: 100 })
    .withMessage('Doctor name cannot exceed 100 characters'),
  body('Specialization')
    .trim()
    .notEmpty()
    .withMessage('Specialization is required')
    .isLength({ max: 100 })
    .withMessage('Specialization cannot exceed 100 characters'),
  handleValidationErrors,
];

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.post('/', doctorValidation, doctorController.createDoctor);
router.patch('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;

