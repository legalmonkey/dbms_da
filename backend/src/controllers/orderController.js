const orderService = require('../services/orderService');
const { sendItem, sendPaginated, sendSuccess, sendError } = require('../utils/response');

async function getOrders(req, res, next) {
  try {
    const result = await orderService.getOrders(req.query);
    return sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }
    return sendItem(res, order);
  } catch (error) {
    next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.body);
    return sendItem(res, order, 201);
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelOrder(req.params.id);
    if (!order) {
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }
    return sendItem(res, order);
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const success = await orderService.deleteOrder(req.params.id);
    if (!success) {
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }
    return sendSuccess(res, 'Order deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  deleteOrder,
};

