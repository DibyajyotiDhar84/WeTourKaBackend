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
    min: 1,
    max: 120
  },

  id_proof: {
    id_type: { 
      type: String, 
      required: true,
      enum: ['Passport', 'Aadhaar', 'Driver License', 'National ID']
    },
    id_number: { 
      type: String, 
      required: true,
      trim: true
    }
  },

  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },

  nationality: {
    type: String,
    trim: true
  }

}, { 
  timestamps: true 
});


// --- HOOKS ---
// Title Case the name (e.g., "john doe" -> "John Doe")
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