const Product = require('../models/Product');

async function listProducts(req, res) {
  const { category } = req.query;
  const query = { isActive: true };
  if (category) query.category = category;

  const products = await Product.find(query).sort({ sortOrder: 1, name: 1 });
  res.json(products);
}

async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
}

async function createProduct(req, res) {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}

async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
}

async function deleteProduct(req, res) {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Deleted' });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
