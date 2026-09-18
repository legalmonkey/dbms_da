const staffService = require('../services/staffService');
const { sendItem, sendList, sendSuccess, sendError } = require('../utils/response');

async function getStaff(req, res, next) {
  try {
    const staff = await staffService.getStaff(req.query);
    return sendList(res, staff);
  } catch (error) {
    next(error);
  }
}

async function getStaffById(req, res, next) {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    if (!staff) {
      return sendError(res, 'NOT_FOUND', 'Staff member not found', 404);
    }
    return sendItem(res, staff);
  } catch (error) {
    next(error);
  }
}

async function createStaff(req, res, next) {
  try {
    const created = await staffService.createStaff(req.body);
    return sendItem(res, created, 201);
  } catch (error) {
    next(error);
  }
}

async function updateStaff(req, res, next) {
  try {
    const updated = await staffService.updateStaff(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'NOT_FOUND', 'Staff member not found', 404);
    }
    return sendItem(res, updated);
  } catch (error) {
    next(error);
  }
}

async function deleteStaff(req, res, next) {
  try {
    const success = await staffService.deleteStaff(req.params.id);
    if (!success) {
      return sendError(res, 'NOT_FOUND', 'Staff member not found', 404);
    }
    return sendSuccess(res, 'Staff member deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};

