const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function list(req, res) {
  res.status(200).json({ data: orders });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}

function create(req, res) {
  const newId = nextId();
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  if (!id) {
    res.locals.order.id = res.locals.order.id;
  } else {
    res.locals.order.id = id;
  }

  res.locals.order.deliverTo = deliverTo;
  res.locals.order.mobileNumber = mobileNumber;
  res.locals.order.status = status;
  res.locals.order.dishes = dishes;

  res.status(200).json({ data: res.locals.order });
}

function destroy(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "Can't delete an order unless it's pending!",
    });
  }
  const index = orders.findIndex((order) => order.id === res.locals.order.id);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

function isValidOrder(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({
      status: 404,
      message: `order id not found: ${orderId}`,
    });
  }
}

function hasValidAddress(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (!deliverTo) {
    next({
      status: 400,
      message: "deliverTo",
    });
  }
  next();
}

function hasValidNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (!mobileNumber) {
    next({
      status: 400,
      message: "mobileNumber",
    });
  }
  next();
}

function hasValidDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
    next({
      status: 400,
      message: "dish",
    });
  }
  if (dishes.length === 0 || !Array.isArray(dishes)) {
    next({
      status: 400,
      message: "must include at least one dish",
    });
  }
  let message = "";
  dishes.forEach((dish, index) => {
    if (dish.quantity <= 0 || typeof dish.quantity !== "number") {
      message = `Dish ${index} must have a quantity that is an integer greater than 0`;
    }
  });
  if (message) {
    next({
      status: 400,
      message: `${message}`,
    });
  } else {
    next();
  }
}

function hasValidStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    !status ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery" &&
      status !== "delivered")
  ) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function hasValidId(req, res, next) {
  const {
    data: { id },
  } = req.body;

  if (id && id !== res.locals.order.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Dish: ${id}, Route: ${res.locals.order.id}`,
    });
  }

  next();
}

module.exports = {
  list,
  read: [isValidOrder, read],
  create: [hasValidAddress, hasValidNumber, hasValidDishes, create],
  update: [
    isValidOrder,
    hasValidAddress,
    hasValidNumber,
    hasValidDishes,
    hasValidId,
    hasValidStatus,
    update,
  ],
  delete: [isValidOrder, destroy],
};
