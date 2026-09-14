const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/summary', dashboardController.getSummary);
router.get('/velocity', dashboardController.getVelocity);
router.get('/activity', dashboardController.getActivity);
router.get('/insight', dashboardController.getInsight);

module.exports = router;
