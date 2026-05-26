import mongoose, { Schema } from 'mongoose';

const bookingSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },

  package_id: {
    type: Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  PackageUserId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },

  travellers: [{
    type: Schema.Types.ObjectId,
    ref: 'Traveller',
    required: true
  }],

  total_price: {
    type: Number,
    required: true,
    min: 0
  },


  booking_status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending'
  },


  payment_status: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Refunded'],
    default: 'Unpaid'
  },


  special_notes: {
    type: String,
    trim: true
  }

}, {

  timestamps: true
});

bookingSchema.index({ user_id: 1, package_id: 1 });



bookingSchema.pre('validate', async function () {
  if (this.isNew || this.isModified('travellers')) {
    try {
      const pkg = await mongoose.model('Package').findById(this.package_id);
      if (!pkg) throw new Error('Package not found');

      this.total_price = pkg.price * this.travellers.length;

    } catch (err) {
      throw new Error({ message: e })
    }
  }
});

bookingSchema.post('save', async function (doc) {
  if (doc.booking_status === 'Confirmed') {
    await mongoose.model('Package').findByIdAndUpdate(doc.package_id, {
      $inc: { max_capacity: -doc.travellers.length }
    });
  }
});

export const Booking = mongoose.model('Booking', bookingSchema);