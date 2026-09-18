const express = require('express');
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const resultsValidation = [
  body('Results')
    .isArray({ min: 1 })
    .withMessage('At least one result row is required'),
  body('Results.*.Test_ID')
    .notEmpty()
    .withMessage('Test ID is required for each result row'),
  body('Results.*.Observed_Value')
    .trim()
    .notEmpty()
    .withMessage('Enter the observed value'),
  body('Results.*.Remark')
    .isIn(['Normal', 'Elevated', 'Critical'])
    .withMessage('Remark must be Normal, Elevated, or Critical'),
  handleValidationErrors,
];

// Note: /pending-results is also mounted at top-level /api/pending-results for exact contract match
router.get('/pending-results', reportController.getPendingResults);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.put('/:id/results', resultsValidation, reportController.saveReportResults);

module.exports = router;

