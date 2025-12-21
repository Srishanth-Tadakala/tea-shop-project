import mongoose from 'mongoose';

const shopStatusSchema = new mongoose.Schema(
  {
    isOpen: {
      type: Boolean,
      required: true,
      default: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: [200, 'Message cannot exceed 200 characters'],
      default: ''
    },
    openingTime: {
      type: String,
      default: '09:00'
    },
    closingTime: {
      type: String,
      default: '18:00'
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
      default: ''
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
      default: null
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
      default: null
    },
    googleMapsUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'Map URL cannot exceed 500 characters'],
      default: ''
    },
    daysOpen: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to update lastUpdated
shopStatusSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Method to toggle shop status
shopStatusSchema.methods.toggleStatus = async function () {
  try {
    this.isOpen = !this.isOpen;
    this.message = this.isOpen ? 'We are open!' : 'We are currently closed';
    const saved = await this.save();
    console.debug(`[ShopStatus] [toggle] Status toggled to ${this.isOpen ? 'OPEN' : 'CLOSED'}`);
    return saved;
  } catch (error) {
    console.error(`[ShopStatus] [toggle] Failed to toggle status: ${error.message}`);
    throw error;
  }
};

// Static method to get current status
shopStatusSchema.statics.getCurrentStatus = async function () {
  try {
    let status = await this.findOne();
    if (!status) {
      try {
        status = await this.create({ isOpen: true });
        console.info(`[ShopStatus] [getCurrentStatus] Created new default status`);
      } catch (createError) {
        console.error(`[ShopStatus] [getCurrentStatus] Failed to create default status: ${createError.message}`);
        throw createError;
      }
    }
    return status;
  } catch (error) {
    console.error(`[ShopStatus] [getCurrentStatus] Failed to retrieve/create status: ${error.message}`);
    throw error;
  }
};

const ShopStatus = mongoose.model('ShopStatus', shopStatusSchema);

export default ShopStatus;
