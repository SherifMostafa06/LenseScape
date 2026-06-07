// models/Studio.js
const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Studio name is required'],
      trim: true,
      minlength: [3, 'Studio name must be at least 3 characters'],
    },
    zone: {
      type: String,
      required: [true, 'Zone is required'],
      enum: {
        values: ['maadi', 'zamalek', 'nasr-city', 'new-cairo'],
        message: 'Zone must be one of: maadi, zamalek, nasr-city, new-cairo',
      },
    },
    lat: { type: Number },
    lng: { type: Number },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: [0, 'Price cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    available: {
      type: Boolean,
      default: true,
    },
    features: {
      type: [String],
      default: [],
    },
    images: {
      type: [String], // Array of file paths / URLs
      default: [],
    },
  },
  { timestamps: true }
);

// Default lat/lng per zone if not provided
studioSchema.pre('save', function () {
  if (!this.lat || !this.lng) {
    const defaults = {
      'maadi':     { lat: 29.9602, lng: 31.2569 },
      'zamalek':   { lat: 30.0626, lng: 31.2197 },
      'nasr-city': { lat: 30.0626, lng: 31.3361 },
      'new-cairo': { lat: 30.0254, lng: 31.4915 },
    };
    const d = defaults[this.zone];
    if (d) { this.lat = d.lat; this.lng = d.lng; }
  }
});

module.exports = mongoose.model('Studio', studioSchema);
