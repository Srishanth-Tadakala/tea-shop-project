import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    aboutTitle: {
      type: String,
      trim: true,
      default: 'About Our Tea Shop'
    },
    aboutDescription: {
      type: String,
      trim: true,
      default: 'We craft memorable tea experiences with care and quality.'
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    contactAddress: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

contentSchema.statics.getCurrentContent = async function () {
  let content = await this.findOne();
  if (!content) {
    content = await this.create({});
  }
  return content;
};

const Content = mongoose.model('Content', contentSchema);

export default Content;
