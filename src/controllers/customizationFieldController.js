const CustomizationField = require('../models/CustomizationField');

const SEED = {
  Pant: [
    { label: 'Fit', fieldKey: 'fit', type: 'select', sortOrder: 1, options: [
      { label: 'Slim Fit', value: 'slim' },
      { label: 'Regular Fit', value: 'regular' },
      { label: 'Loose Fit', value: 'loose' },
    ]},
    { label: 'Pocket Style', fieldKey: 'pocket', type: 'select', sortOrder: 2, options: [
      { label: 'Side Pocket', value: 'side' },
      { label: 'Welt Pocket', value: 'welt' },
      { label: 'No Pocket', value: 'none' },
    ]},
    { label: 'Bottom', fieldKey: 'bottom', type: 'select', sortOrder: 3, options: [
      { label: 'Plain', value: 'plain' },
      { label: 'Cuffed', value: 'cuffed' },
      { label: 'Tapered', value: 'tapered' },
    ]},
    { label: 'Belt Loop', fieldKey: 'beltLoop', type: 'toggle', sortOrder: 4, options: [
      { label: 'With Belt Loop', value: 'yes' },
      { label: 'Without', value: 'no' },
    ]},
  ],
  Shirt: [
    { label: 'Collar', fieldKey: 'collar', type: 'select', sortOrder: 1, options: [
      { label: 'Spread Collar', value: 'spread' },
      { label: 'Button-Down', value: 'buttondown' },
      { label: 'Mandarin', value: 'mandarin' },
      { label: 'Camp Collar', value: 'camp' },
    ]},
    { label: 'Sleeve', fieldKey: 'sleeve', type: 'toggle', sortOrder: 2, options: [
      { label: 'Full Sleeve', value: 'full' },
      { label: 'Half Sleeve', value: 'half' },
    ]},
    { label: 'Pocket', fieldKey: 'pocket', type: 'toggle', sortOrder: 3, options: [
      { label: 'With Pocket', value: 'yes' },
      { label: 'No Pocket', value: 'no' },
    ]},
    { label: 'Fit', fieldKey: 'fit', type: 'select', sortOrder: 4, options: [
      { label: 'Slim Fit', value: 'slim' },
      { label: 'Regular Fit', value: 'regular' },
      { label: 'Relaxed Fit', value: 'relaxed' },
    ]},
  ],
  Jabba: [
    { label: 'Length', fieldKey: 'length', type: 'select', sortOrder: 1, options: [
      { label: 'Short (Knee)', value: 'short' },
      { label: 'Mid (Below Knee)', value: 'mid' },
      { label: 'Long (Ankle)', value: 'long' },
    ]},
    { label: 'Collar', fieldKey: 'collar', type: 'select', sortOrder: 2, options: [
      { label: 'Round Neck', value: 'round' },
      { label: 'V-Neck', value: 'vneck' },
      { label: 'Mandarin', value: 'mandarin' },
      { label: 'No Collar', value: 'none' },
    ]},
    { label: 'Sleeve', fieldKey: 'sleeve', type: 'toggle', sortOrder: 3, options: [
      { label: 'Full Sleeve', value: 'full' },
      { label: 'Half Sleeve', value: 'half' },
    ]},
    { label: 'Side Slit', fieldKey: 'slit', type: 'toggle', sortOrder: 4, options: [
      { label: 'With Slit', value: 'yes' },
      { label: 'No Slit', value: 'no' },
    ]},
  ],
  Salwar: [
    { label: 'Waist Style', fieldKey: 'waist', type: 'select', sortOrder: 1, options: [
      { label: 'Elastic Waist', value: 'elastic' },
      { label: 'Drawstring', value: 'drawstring' },
      { label: 'Fitted Waist', value: 'fitted' },
    ]},
    { label: 'Length', fieldKey: 'length', type: 'select', sortOrder: 2, options: [
      { label: 'Full Length', value: 'full' },
      { label: '3/4 Length', value: 'threequarter' },
      { label: 'Ankle Length', value: 'ankle' },
    ]},
    { label: 'Fit', fieldKey: 'fit', type: 'select', sortOrder: 3, options: [
      { label: 'Loose', value: 'loose' },
      { label: 'Regular', value: 'regular' },
      { label: 'Fitted', value: 'fitted' },
    ]},
  ],
};

exports.listFields = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const fields = await CustomizationField.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.json(fields);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createField = async (req, res) => {
  try {
    const field = await CustomizationField.create(req.body);
    res.status(201).json(field);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.updateField = async (req, res) => {
  try {
    const field = await CustomizationField.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!field) return res.status(404).json({ message: 'Not found' });
    res.json(field);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.deleteField = async (req, res) => {
  try {
    await CustomizationField.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.seedFields = async (req, res) => {
  try {
    const results = {};
    for (const [category, items] of Object.entries(SEED)) {
      const count = await CustomizationField.countDocuments({ category });
      if (count === 0) {
        await CustomizationField.insertMany(items.map(i => ({ ...i, category })));
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
