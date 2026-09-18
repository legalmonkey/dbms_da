const doctorService = require('../services/doctorService');
const { sendItem, sendList, sendSuccess, sendError } = require('../utils/response');

async function getDoctors(req, res, next) {
  try {
    const doctors = await doctorService.getDoctors();
    return sendList(res, doctors);
  } catch (error) {
    next(error);
  }
}

async function getDoctorById(req, res, next) {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) {
      return sendError(res, 'NOT_FOUND', 'Doctor not found', 404);
    }
    return sendItem(res, doctor);
  } catch (error) {
    next(error);
  }
}

async function createDoctor(req, res, next) {
  try {
    const created = await doctorService.createDoctor(req.body);
    return sendItem(res, created, 201);
  } catch (error) {
    next(error);
  }
}

async function updateDoctor(req, res, next) {
  try {
    const updated = await doctorService.updateDoctor(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 'NOT_FOUND', 'Doctor not found', 404);
    }
    return sendItem(res, updated);
  } catch (error) {
    next(error);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    const success = await doctorService.deleteDoctor(req.params.id);
    if (!success) {
      return sendError(res, 'NOT_FOUND', 'Doctor not found', 404);
    }
    return sendSuccess(res, 'Doctor deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};

