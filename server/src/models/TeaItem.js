import mongoose from 'mongoose';

const teaItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tea name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    ingredients: {
      type: [String],
      default: []
    },
    image: {
      type: String,
      default: '/images/default-tea.jpg'
    },
    category: {
      type: String,
      enum: ['green', 'black', 'oolong', 'white', 'herbal', 'blend', 'other'],
      default: 'other'
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Index for search optimization
teaItemSchema.index({ name: 'text', description: 'text' });
teaItemSchema.index({ category: 1, isAvailable: 1 });

// Virtual for formatted price
teaItemSchema.virtual('formattedPrice').get(function () {
  return `₹${this.price.toFixed(2)}`;
});

// Method to toggle availability
teaItemSchema.methods.toggleAvailability = async function () {
  try {
    this.isAvailable = !this.isAvailable;
    const saved = await this.save();
    console.debug(`[TeaItem] [toggle] Item ${this._id} availability toggled to ${this.isAvailable}`);
    return saved;
  } catch (error) {
    console.error(`[TeaItem] [toggle] Failed to toggle availability: ${error.message}`);
    // Re-throw to let controller handle it
    throw error;
  }
};

const TeaItem = mongoose.model('TeaItem', teaItemSchema);

export default TeaItem;
