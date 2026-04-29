require('dotenv').config();
const mongoose = require('mongoose');
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

  // NOTE: firebaseUid is left empty in seed — set it after creating real Firebase accounts
  // or use Firebase's "Import users" feature with the test emails below.

  const admin = await User.create({
    email: 'admin@sagaan.in',
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
      email: 'arjun.mehta@gmail.com', name: 'Arjun Mehta', role: 'customer', initials: 'AM',
      measurements: { chest: 40, shoulder: 18, waist: 34, hip: 40, sleeve: 25, neck: 15.5, inseam: 30, armhole: 20, biceps: 13.5 },
    },
    {
      email: 'farah.sheikh@yahoo.com', name: 'Farah Sheikh', role: 'customer', initials: 'FS',
      measurements: { chest: 36, shoulder: 15, waist: 28, hip: 36, sleeve: 23, neck: 14, inseam: 28, armhole: 17, biceps: 11.5 },
    },
    {
      email: 'rohit.singh@gmail.com', name: 'Rohit Singh', role: 'customer', initials: 'RS',
      measurements: { chest: 42, shoulder: 18.5, waist: 36, hip: 41, sleeve: 25.5, neck: 16, inseam: 31, armhole: 21, biceps: 14 },
    },
    {
      email: 'priya.nair@outlook.com', name: 'Priya Nair', role: 'customer', initials: 'PN',
      measurements: { chest: 34, shoulder: 14.5, waist: 26, hip: 35, sleeve: 22.5, neck: 13.5, inseam: 27, armhole: 16, biceps: 11 },
    },
  ]);

  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 86400000);

  await Order.insertMany([
    {
      customer: customers[0]._id, product: 'Biella Two-Piece', fabric: 'Midnight super-130',
      fabricClass: 'midnight-wool', stage: 'stitching', assignedTo: workers[1]._id,
      dueDate: days(7), price: 48900, paid: 25000, channel: 'app',
      history: [
        { stage: 'measured',  at: days(-5), byName: 'Master Ravi', byId: admin._id },
        { stage: 'cutting',   at: days(-2), byName: 'Ravi Kaka',   byId: workers[0]._id },
        { stage: 'stitching', at: days(-1), byName: 'Imran',       byId: workers[1]._id },
      ],
    },
    {
      customer: customers[1]._id, product: 'Silk Kurta Set', fabric: 'Champagne silk',
      fabricClass: 'champagne-silk', stage: 'finishing', assignedTo: workers[3]._id,
      dueDate: days(3), price: 18500, paid: 18500, channel: 'shop',
      history: [
        { stage: 'measured',  at: days(-8), byName: 'Master Ravi', byId: admin._id },
        { stage: 'cutting',   at: days(-6), byName: 'Ravi Kaka',   byId: workers[0]._id },
        { stage: 'stitching', at: days(-4), byName: 'Sunita ji',   byId: workers[2]._id },
        { stage: 'finishing', at: days(-2), byName: 'Kishan',      byId: workers[3]._id },
      ],
    },
    {
      customer: customers[2]._id, product: 'Oxford Shirt × 3', fabric: 'Ivory linen',
      fabricClass: 'ivory-linen', stage: 'ready', assignedTo: workers[4]._id,
      dueDate: days(1), price: 12600, paid: 12600, channel: 'shop',
      history: [
        { stage: 'measured',  at: days(-12), byName: 'Master Ravi', byId: admin._id },
        { stage: 'cutting',   at: days(-10), byName: 'Ravi Kaka',   byId: workers[0]._id },
        { stage: 'stitching', at: days(-7),  byName: 'Imran',       byId: workers[1]._id },
        { stage: 'finishing', at: days(-4),  byName: 'Kishan',      byId: workers[3]._id },
        { stage: 'ready',     at: days(-2),  byName: 'Meera',       byId: workers[4]._id },
      ],
    },
    {
      customer: customers[3]._id, product: 'Anarkali, full set', fabric: 'Oxblood twill',
      fabricClass: 'oxblood-twill', stage: 'cutting', assignedTo: workers[0]._id,
      dueDate: days(14), price: 32400, paid: 10000, channel: 'app',
      history: [
        { stage: 'measured', at: days(-3), byName: 'Master Ravi', byId: admin._id },
        { stage: 'cutting',  at: days(-1), byName: 'Ravi Kaka',   byId: workers[0]._id },
      ],
    },
    {
      customer: customers[0]._id, product: 'Linen Bandhgala', fabric: 'Ivory linen',
      fabricClass: 'ivory-linen', stage: 'measured', assignedTo: null,
      dueDate: days(18), price: 22000, paid: 0, channel: 'shop',
      history: [
        { stage: 'measured', at: days(-1), byName: 'Master Ravi', byId: admin._id },
      ],
    },
  ]);

  await Product.insertMany(PRODUCTS.map((p, i) => ({ ...p, sortOrder: i })));

  console.log('✓ Seeded successfully');
  console.log('\nTest accounts (create these in Firebase → Authentication → Users):');
  console.log('  admin@sagaan.in       — role: admin');
  console.log('  arjun.mehta@gmail.com — role: customer');
  console.log('  farah.sheikh@yahoo.com — role: customer');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
