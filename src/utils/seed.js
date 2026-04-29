require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const PRODUCTS = [
  { name: 'Two-Piece Suit',   category: 'Suits',   basePrice: 45000 },
  { name: 'Three-Piece Suit', category: 'Suits',   basePrice: 55000 },
  { name: 'Bandhgala',        category: 'Ethnic',  basePrice: 22000 },
  { name: 'Kurta Set',        category: 'Ethnic',  basePrice: 12000 },
  { name: 'Oxford Shirt',     category: 'Shirts',  basePrice: 4200  },
  { name: 'Trousers',         category: 'Bottoms', basePrice: 8500  },
  { name: 'Sherwani',         category: 'Ethnic',  basePrice: 65000 },
  { name: 'Anarkali',         category: 'Ethnic',  basePrice: 28000 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([User.deleteMany({}), Order.deleteMany({}), Product.deleteMany({})]);

  const adminPass  = await bcrypt.hash('admin123', 10);
  const custPass   = await bcrypt.hash('customer123', 10);

  const admin = await User.create({
    email: 'admin@sagaan.in',
    password: adminPass,
    name: 'Master Ravi',
    role: 'admin',
    shopName: 'Sagaan Atelier',
    initials: 'MR',
  });

  const workers = await User.insertMany([
    { email: 'ravikaka@sagaan.in',  name: 'Ravi Kaka',  role: 'worker', workerRole: 'Master cutter', initials: 'RK', load: 4 },
    { email: 'imran@sagaan.in',     name: 'Imran',      role: 'worker', workerRole: 'Stitching',      initials: 'IM', load: 7 },
    { email: 'sunitaji@sagaan.in',  name: 'Sunita ji',  role: 'worker', workerRole: 'Stitching',      initials: 'SJ', load: 5 },
    { email: 'kishan@sagaan.in',    name: 'Kishan',     role: 'worker', workerRole: 'Finishing',      initials: 'KS', load: 3 },
    { email: 'meera@sagaan.in',     name: 'Meera',      role: 'worker', workerRole: 'Press & QA',     initials: 'ME', load: 2 },
  ]);

  const customers = await User.insertMany([
    {
      email: 'arjun.mehta@gmail.com', password: custPass, name: 'Arjun Mehta', role: 'customer', initials: 'AM',
      measurements: { chest: 40, shoulder: 18, waist: 34, hip: 40, sleeve: 25, neck: 15.5, inseam: 30, armhole: 20, biceps: 13.5 },
    },
    {
      email: 'farah.sheikh@yahoo.com', password: custPass, name: 'Farah Sheikh', role: 'customer', initials: 'FS',
      measurements: { chest: 36, shoulder: 15, waist: 28, hip: 36, sleeve: 23, neck: 14, inseam: 28, armhole: 17, biceps: 11.5 },
    },
  ]);

  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 86400000);

  await Order.insertMany([
    {
      customer: customers[0]._id, product: 'Simple Pant', stage: 'stitching', assignedTo: workers[1]._id,
      dueDate: days(7), price: 800, paid: 400, channel: 'app',
      garmentCategory: 'Pant', garmentDesign: 'Simple Pant',
      history: [
        { stage: 'measured',  at: days(-5), byName: 'Master Ravi', byId: admin._id },
        { stage: 'cutting',   at: days(-2), byName: 'Ravi Kaka',   byId: workers[0]._id },
        { stage: 'stitching', at: days(-1), byName: 'Imran',       byId: workers[1]._id },
      ],
    },
    {
      customer: customers[1]._id, product: 'Simple Kurta', stage: 'finishing', assignedTo: workers[3]._id,
      dueDate: days(3), price: 1200, paid: 1200, channel: 'shop',
      garmentCategory: 'Jabba', garmentDesign: 'Simple Kurta',
      history: [
        { stage: 'measured',  at: days(-8), byName: 'Master Ravi', byId: admin._id },
        { stage: 'cutting',   at: days(-6), byName: 'Ravi Kaka',   byId: workers[0]._id },
        { stage: 'stitching', at: days(-4), byName: 'Sunita ji',   byId: workers[2]._id },
        { stage: 'finishing', at: days(-2), byName: 'Kishan',      byId: workers[3]._id },
      ],
    },
  ]);

  await Product.insertMany(PRODUCTS.map((p, i) => ({ ...p, sortOrder: i })));

  console.log('✓ Seeded successfully');
  console.log('\nTest accounts:');
  console.log('  admin@sagaan.in       / admin123    — role: admin');
  console.log('  arjun.mehta@gmail.com / customer123 — role: customer');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
