import {Schema,model} from 'mongoose';

const reviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId ,ref:'users', required: true },
  itemId: { type: Schema.Types.ObjectId , refPath: 'category',required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Hotels', 'Package'] 
  },
  rating: { 
    type: Map, 
    of: Number, 
    required: true 
  },
  overallRating: { type:Schema.Types.Decimal128, default: 0 },
  comment: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.pre('save', function() {
  if (this.isModified('rating')) {
    const values = Array.from(this.rating.values());
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    this.overallRating = Number((sum / values.length).toFixed(1));
  }
});

reviewSchema.post('save', async function() {
  await this.constructor.calculateAverage(this.itemId, this.category);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.calculateAverage(doc.itemId, doc.category);
  }
});

reviewSchema.statics.calculateAverage = async function(itemId, category) {
  const stats = await this.aggregate([
    { $match: { itemId: itemId } },
    {
      $group: {
        _id: '$itemId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$overallRating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await model(category).findByIdAndUpdate(itemId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10
    });
  } else {
    await model(category).findByIdAndUpdate(itemId, {
      ratingsQuantity: 0,
      ratingsAverage: 0
    });
  }
};

reviewSchema.methods.getRatingSummary = function() {
  return Object.fromEntries(this.rating);
};

export const reviewModel = model('Reviews', reviewSchema);