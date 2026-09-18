const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const orderValidation = [
  body('Patient_ID')
    .trim()
    .notEmpty()
    .withMessage('Select a patient for the order'),
  body('Test_IDs')
    .isArray({ min: 1 })
    .withMessage('Select at least one test for the order'),
  body('Doctor_ID')
    .optional({ nullable: true }),
  body('Order_Date')
    .optional()
    .isISO8601()
    .withMessage('Order date must be a valid date'),
  handleValidationErrors,
];

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderValidation, orderController.createOrder);
router.patch('/:id/cancel', orderController.cancelOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;

