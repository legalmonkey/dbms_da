const laboratoryService = require('../services/laboratoryService');
const { sendItem, sendList, sendSuccess, sendError } = require('../utils/response');

async function getLaboratories(req, res, next) {
  try {
    const labs = await laboratoryService.getLaboratories();
    return sendList(res, labs);
  } catch (error) {
    next(error);
  }
}

async function getLaboratoryById(req, res, next) {
  try {
    const lab = await laboratoryService.getLaboratoryById(req.params.id);
    if (!lab) {
      return sendError(res, 'NOT_FOUND', 'Laboratory not found', 404);
    }
    return sendItem(res, lab);
  } catch (error) {
    next(error);
  }
}

async function createLaboratory(req, res, next) {
  try {
    const created = await laboratoryService.createLaboratory(req.body);
    return sendItem(res, created, 201);
  } catch (error) {
    next(error);
  }
}

async function updateLaboratory(req, res, next) {
  try {
    const updated = await laboratoryService.updateLaboratory(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'NOT_FOUND', 'Laboratory not found', 404);
    }
    return sendItem(res, updated);
  } catch (error) {
    next(error);
  }
}

async function deleteLaboratory(req, res, next) {
  try {
    const success = await laboratoryService.deleteLaboratory(req.params.id);
    if (!success) {
      return sendError(res, 'NOT_FOUND', 'Laboratory not found', 404);
    }
    return sendSuccess(res, 'Laboratory deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory,
};

