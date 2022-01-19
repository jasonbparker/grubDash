const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");

function list(req, res) {
  res.status(200).json({ data: dishes });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.dish });
}

function create(req, res) {
  const newId = nextId();
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  if (!id) {
    res.locals.dish.id = res.locals.dish.id;
  } else {
    res.locals.dish.id = id;
  }
  res.locals.dish.name = name;
  res.locals.dish.description = description;
  res.locals.dish.price = price;
  res.locals.dish.image_url = image_url;

  res.status(200).json({ data: res.locals.dish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    next({
      status: 404,
      message: `dish id not found: ${dishId}`,
    });
  }
}

function bodyHasName(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    return next();
  }
  next({ status: 400, message: "A 'name' property is required." });
}

function bodyHasDesc(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (!description) {
    next({
      status: 400,
      message: "A 'description' property is required.",
    });
  }
  next();
}

function bodyHasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (!price) {
    next({
      status: 400,
      message: "A 'price' property is required.",
    });
  }

  if (price <= 0 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: "price must be greater than 0",
    });
  }
  next();
}

function bodyHasUrl(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  //   if (image_url && image_url !== "")
  if (!image_url) {
    next({
      status: 400,
      message: "image_url",
    });
  }
  next();
}

function hasValidId(req, res, next) {
  const {
    data: { id },
  } = req.body;

  if (id && id !== res.locals.dish.id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
    });
  }

  next();
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [bodyHasName, bodyHasDesc, bodyHasPrice, bodyHasUrl, create],
  update: [
    dishExists,
    bodyHasName,
    bodyHasDesc,
    bodyHasPrice,
    bodyHasUrl,
    hasValidId,
    update,
  ],
};
