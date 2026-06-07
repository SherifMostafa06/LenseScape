// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    hours: {
      type: Number,
      required: [true, 'Number of hours is required'],
      min: [1, 'Minimum booking is 1 hour'],
      max: [12, 'Maximum booking is 12 hours'],
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Auto-calculate totalPrice before saving
bookingSchema.pre('save', async function () {
  if (this.isModified('hours') || this.isModified('studioId')) {
    const Studio = mongoose.model('Studio');
    const studio = await Studio.findById(this.studioId).select('price');
    if (studio) this.totalPrice = studio.price * this.hours;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
