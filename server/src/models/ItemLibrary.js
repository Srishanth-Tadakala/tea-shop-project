import mongoose from 'mongoose';

const itemLibrarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
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
    tags: {
      type: [String],
      default: []
    },
    isTemplate: {
      type: Boolean,
      default: true
    },
    usageCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters']
    }
  },
  {
    timestamps: true
  }
);

// Index for search optimization
itemLibrarySchema.index({ name: 'text', description: 'text' });
itemLibrarySchema.index({ category: 1 });

// Method to create a tea item from this template
itemLibrarySchema.methods.createTeaItem = async function (customizations = {}) {
  const TeaItem = mongoose.model('TeaItem');
  
  const teaItemData = {
    name: customizations.name || this.name,
    description: customizations.description || this.description,
    price: customizations.price || this.basePrice,
    ingredients: customizations.ingredients || this.ingredients,
    image: customizations.image || this.image,
    category: customizations.category || this.category,
    tags: customizations.tags || this.tags,
    isAvailable: customizations.isAvailable !== undefined ? customizations.isAvailable : true,
    stock: customizations.stock || 0
  };

  let teaItem;
  try {
    teaItem = await TeaItem.create(teaItemData);
  } catch (createError) {
    console.error(`[ItemLibrary] [createTeaItem] Failed to create tea item: ${createError.message}`);
    throw createError;
  }
  
  // Increment usage count
  try {
    this.usageCount += 1;
    await this.save();
    console.debug(`[ItemLibrary] [createTeaItem] Created item from template ${this._id}, usage count: ${this.usageCount}`);
  } catch (saveError) {
    console.error(`[ItemLibrary] [createTeaItem] Failed to update template usage count: ${saveError.message}`);
    // Log but don't fail - item was created successfully
  }
  
  return teaItem;
};

// Static method to get most used templates
itemLibrarySchema.statics.getMostUsed = async function (limit = 10) {
  try {
    const templates = await this.find().sort({ usageCount: -1 }).limit(limit);
    return templates;
  } catch (error) {
    console.error(`[ItemLibrary] [getMostUsed] Failed to retrieve templates: ${error.message}`);
    throw error;
  }
};

const ItemLibrary = mongoose.model('ItemLibrary', itemLibrarySchema);

export default ItemLibrary;
