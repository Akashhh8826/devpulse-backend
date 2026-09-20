const store = require('../data/store');
const { sendSuccess } = require('../utils/response');

async function getSummary(req, res, next) {
  try {
    const summary = await store.getDashboardSummary();
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

async function getVelocity(req, res, next) {
  try {
    const velocity = await store.getDashboardVelocity();
    return sendSuccess(res, velocity);
  } catch (err) {
    next(err);
  }
}

async function getActivity(req, res, next) {
  try {
    const { page, limit } = req.query;
    const activityData = await store.getDashboardActivity({ page, limit });
    return sendSuccess(res, activityData.logs, 200, activityData.pagination);
  } catch (err) {
    next(err);
  }
}

async function getInsight(req, res, next) {
  try {
    const insightData = await store.getDashboardInsight();
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
