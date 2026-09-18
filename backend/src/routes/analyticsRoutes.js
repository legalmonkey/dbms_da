const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/summary', analyticsController.getWorkspaceSummary);

module.exports = router;

