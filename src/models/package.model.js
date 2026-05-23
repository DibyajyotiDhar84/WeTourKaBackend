import mongoose, { Schema } from 'mongoose';

const packageSchema = new Schema({

  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },

      
  destination: {
    type: String,
    required: true,
    trim: true
  },


  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },

 
  price: {
    type: Number,
    required: true,
    min: 0
  },


  accommodation: {
    hotel_name: { type: String, required: true },
    star_rating: { type: Number, min: 1, max: 5 },
    room_type: { type: String },
    amenities: [String] 
  },

  travel: {
    mode: { 
      type: String, 
      enum: ['Flight', 'Train', 'Bus', 'Cruise'], 
      required: true 
    },
    departure_from: { type: String, required: true },
    arrival_at: { type: String, required: true },
    carrier: { type: String }, 
    is_round_trip: { type: Boolean, default: true }
  },

  
  guide: {
    name: { type: String },
    languages: [String],
    is_included: { type: Boolean, default: true },
    guide_rating: { type: Number, default: 0 }
  },

  image_url: { type: String },
  activities: { type: String },
  max_capacity: { type: Number, default: 20 },
  status: { 
    type: String, 
    enum: ['Active', 'Draft', 'Archieved'], 
    default: 'Active' 
  }
}, { 
  timestamps: true
});


packageSchema.index({destination:1, start_date:1});

packageSchema.pre('save', function() {
  if (this.start_date >= this.end_date) {
    return new Error('End date must be strictly after start date.')
  }
});


packageSchema.methods.isBookable = function() {
  return this.status === 'Active' && 
         this.max_capacity > 0 && 
         new Date(this.start_date) > new Date();
};


export const Package = mongoose.model('Package', packageSchema);

