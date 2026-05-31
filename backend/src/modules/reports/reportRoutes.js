const express = require('express');
const router = express.Router();
const controller = require('./pdfControllador');

router.get('/periods', controller.getPeriods);
router.post('/generate', controller.generateReport);

module.exports = router;