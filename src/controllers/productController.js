const Product = require('../models/Product');

async function listProducts(req, res) {
  try {
    const { category, active } = req.query;
    const query = {};
    if (category) query.category = category;
    if (active !== 'false') query.isActive = true;
    const products = await Product.find(query).sort({ category: 1, sortOrder: 1, createdAt: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function getProduct(req, res) {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
}

async function createProduct(req, res) {
  try {
    const { name, category, description, basePrice, images, itemCode, sortOrder } = req.body;
    const product = await Product.create({
      name, category,
      description: description || '',
      basePrice: Number(basePrice) || 0,
      images: images || [],
      itemCode: itemCode || '',
      sortOrder: Number(sortOrder) || 0,
    });
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function updateProduct(req, res) {
  try {
    const allowed = ['name', 'category', 'description', 'basePrice', 'images', 'itemCode', 'isActive', 'sortOrder'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product removed' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
