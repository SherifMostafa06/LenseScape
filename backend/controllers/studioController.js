// controllers/studioController.js
const { validationResult } = require('express-validator');
const Studio     = require('../models/Studio');
const asyncWrapper = require('../middleware/asyncWrapper');
const AppError   = require('../utils/AppError');

// GET /api/studios  — public, paginated
const getAllStudios = asyncWrapper(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 6);
  const skip  = (page - 1) * limit;

  const filter = { available: true };
  if (req.query.zone && req.query.zone !== 'all') filter.zone = req.query.zone;
  if (req.query.search) {
    filter.$or = [
      { name:        { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { features:    { $elemMatch: { $regex: req.query.search, $options: 'i' } } },
    ];
  }

  const [studios, total] = await Promise.all([
    Studio.find(filter).populate('ownerId', 'name email').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Studio.countDocuments(filter),
  ]);

  res.json({
    success: true,
    studios,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// GET /api/studios/:id — public
const getStudio = asyncWrapper(async (req, res, next) => {
  const studio = await Studio.findById(req.params.id).populate('ownerId', 'name email');
  if (!studio) return next(new AppError('Studio not found', 404));
  res.json({ success: true, studio });
});

// POST /api/studios — owner only
const createStudio = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

  const { name, zone, lat, lng, description, price, capacity, features } = req.body;

  // Handle uploaded images
  const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

  // Parse features from comma-separated string or JSON array
  let parsedFeatures = [];
  if (features) {
    try { parsedFeatures = JSON.parse(features); }
    catch { parsedFeatures = features.split(',').map((f) => f.trim()); }
  }

  const studio = await Studio.create({
    ownerId: req.session.userId,
    name, zone,
    lat:  lat  ? parseFloat(lat)  : undefined,
    lng:  lng  ? parseFloat(lng)  : undefined,
    description,
    price:    parseFloat(price),
    capacity: parseInt(capacity),
    features: parsedFeatures,
    images,
  });

  res.status(201).json({ success: true, message: 'Studio created', studio });
});

// PUT /api/studios/:id — owner (own studio) or admin
const updateStudio = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

  const studio = await Studio.findById(req.params.id);
  if (!studio) return next(new AppError('Studio not found', 404));

  // Only the owner or admin can update
  if (studio.ownerId.toString() !== req.session.userId.toString() && req.session.role !== 'admin') {
    return next(new AppError('You can only edit your own studios', 403));
  }

  const { name, zone, lat, lng, description, price, capacity, available, features } = req.body;

  if (name)        studio.name        = name;
  if (zone)        studio.zone        = zone;
  if (lat)         studio.lat         = parseFloat(lat);
  if (lng)         studio.lng         = parseFloat(lng);
  if (description) studio.description = description;
  if (price)       studio.price       = parseFloat(price);
  if (capacity)    studio.capacity    = parseInt(capacity);
  if (available !== undefined) studio.available = available === 'true' || available === true;
  if (features) {
    try { studio.features = JSON.parse(features); }
    catch { studio.features = features.split(',').map((f) => f.trim()); }
  }
  if (req.files?.length) {
    studio.images = req.files.map((f) => `/uploads/${f.filename}`);
  }

  await studio.save();
  res.json({ success: true, message: 'Studio updated', studio });
});

// DELETE /api/studios/:id — owner or admin
const deleteStudio = asyncWrapper(async (req, res, next) => {
  const studio = await Studio.findById(req.params.id);
  if (!studio) return next(new AppError('Studio not found', 404));

  if (studio.ownerId.toString() !== req.session.userId.toString() && req.session.role !== 'admin') {
    return next(new AppError('You can only delete your own studios', 403));
  }

  await studio.deleteOne();
  res.json({ success: true, message: 'Studio deleted' });
});

// GET /api/studios/my — owner's own studios
const getMyStudios = asyncWrapper(async (req, res) => {
  const studios = await Studio.find({ ownerId: req.session.userId }).sort({ createdAt: -1 });
  res.json({ success: true, studios });
});

module.exports = { getAllStudios, getStudio, createStudio, updateStudio, deleteStudio, getMyStudios };
