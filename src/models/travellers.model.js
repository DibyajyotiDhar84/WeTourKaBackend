import mongoose, { Schema } from 'mongoose';

const travellerSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  age: {
    type: Number,
    min: 0,
    max: 120
  },

  id_proof: {
    id_type: { 
      type: String, 
      required: true,
      enum: ['Passport', 'Aadhaar', 'Driver License', 'VoterID']
    },
    id_number: { 
      type: String, 
      required: true,
      trim: true
    }
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  nationality: {
    type: String,
    trim: true
  }

}, { 
  timestamps: true 
});


travellerSchema.pre('save', function() {
  if (this.isModified('name')) {
    this.name = this.name
      .toLowerCase()
      .split(' ')
      .map(s => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ');
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
});

export const Traveller = mongoose.model('Traveller', travellerSchema);