const Product = require('../models/productModel');

function listProducts(req, res) {
  res.json(Product.getAll());
}

module.exports = { listProducts };
