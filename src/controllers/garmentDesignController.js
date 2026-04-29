const GarmentDesign = require('../models/GarmentDesign');

const SEED = {
  Pant: [
    { name: 'Simple Pant',    desc: 'Clean flat-front straight cut', sortOrder: 1 },
    { name: 'Single Pleat',   desc: 'One front pleat, classic look',  sortOrder: 2 },
    { name: 'Double Pleat',   desc: 'Two pleats, generous room',      sortOrder: 3 },
    { name: 'Jogger Pant',    desc: 'Tapered leg with elastic waist', sortOrder: 4 },
    { name: 'Bell Bottom',    desc: 'Flared below the knee',          sortOrder: 5 },
  ],
  Shirt: [
    { name: 'Simple Shirt',     desc: 'Classic button-down collar',      sortOrder: 1 },
    { name: 'Apple Cut Shirt',  desc: 'Slightly flared hem, smart look', sortOrder: 2 },
    { name: 'Bush Shirt',       desc: 'Relaxed camp-collar style',       sortOrder: 3 },
    { name: 'Kurta Shirt',      desc: 'Long kurta-style casual shirt',   sortOrder: 4 },
  ],
  Jabba: [
    { name: 'Simple Kurta',    desc: 'Straight silhouette, everyday',    sortOrder: 1 },
    { name: 'Pathani Kurta',   desc: 'Side slits, traditional Pathan',  sortOrder: 2 },
    { name: 'Sherwani Style',  desc: 'Formal long kurta for occasions', sortOrder: 3 },
    { name: 'Angrakha',        desc: 'Wrap-style with diagonal hem',    sortOrder: 4 },
  ],
  Salwar: [
    { name: 'Simple Salwar',   desc: 'Comfortable everyday salwar',     sortOrder: 1 },
    { name: 'Patiala Salwar',  desc: 'Wide pleated Punjabi style',      sortOrder: 2 },
    { name: 'Churidar',        desc: 'Fitted gathered at ankle',        sortOrder: 3 },
    { name: 'Palazzo Salwar',  desc: 'Wide-leg flowing silhouette',     sortOrder: 4 },
  ],
};

exports.listDesigns = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const designs = await GarmentDesign.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.json(designs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createDesign = async (req, res) => {
  try {
    const design = await GarmentDesign.create(req.body);
    res.status(201).json(design);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.updateDesign = async (req, res) => {
  try {
    const design = await GarmentDesign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!design) return res.status(404).json({ message: 'Not found' });
    res.json(design);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.deleteDesign = async (req, res) => {
  try {
    await GarmentDesign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.seedDesigns = async (req, res) => {
  try {
    const results = {};
    for (const [category, items] of Object.entries(SEED)) {
      const count = await GarmentDesign.countDocuments({ category });
      if (count === 0) {
        await GarmentDesign.insertMany(items.map(i => ({ ...i, category })));
        results[category] = `seeded ${items.length}`;
      } else {
        results[category] = `skipped (${count} exist)`;
      }
    }
    res.json({ message: 'Seed complete', results });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
