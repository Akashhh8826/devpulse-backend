const store = require('../data/store');
const { sendSuccess } = require('../utils/response');

function getSummary(req, res, next) {
  try {
    const summary = store.getDashboardSummary();
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

function getVelocity(req, res, next) {
  try {
    const velocity = store.getDashboardVelocity();
    return sendSuccess(res, velocity);
  } catch (err) {
    next(err);
  }
}

function getActivity(req, res, next) {
  try {
    const { page, limit } = req.query;
    const activityData = store.getDashboardActivity({ page, limit });
    return sendSuccess(res, activityData.logs, 200, activityData.pagination);
  } catch (err) {
    next(err);
  }
}

function getInsight(req, res, next) {
  try {
    const insightData = store.getDashboardInsight();
    return sendSuccess(res, insightData);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getVelocity,
  getActivity,
  getInsight,
};
