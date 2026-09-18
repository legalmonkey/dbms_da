const patientService = require('../services/patientService');
const { sendItem, sendPaginated, sendSuccess, sendError } = require('../utils/response');

async function getPatients(req, res, next) {
  try {
    const result = await patientService.getPatients(req.query);
    return sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

async function getPatientById(req, res, next) {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) {
      return sendError(res, 'NOT_FOUND', 'Patient not found', 404);
    }
    return sendItem(res, patient);
  } catch (error) {
    next(error);
  }
}

async function createPatient(req, res, next) {
  try {
    const created = await patientService.createPatient(req.body);
    return sendItem(res, created, 201);
  } catch (error) {
    next(error);
  }
}

async function updatePatient(req, res, next) {
  try {
    const updated = await patientService.updatePatient(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'NOT_FOUND', 'Patient not found', 404);
    }
    return sendItem(res, updated);
  } catch (error) {
    next(error);
  }
}

async function deletePatient(req, res, next) {
  try {
    const success = await patientService.deletePatient(req.params.id);
    if (!success) {
      return sendError(res, 'NOT_FOUND', 'Patient not found', 404);
    }
    return sendSuccess(res, 'Patient deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};

