import { Schema, model } from 'mongoose';

const contactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    officeAddress: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Client', 'Recruiter', 'Investor', 'Developer', 'Business Partner', 'Customer', 'Friend', 'Other'],
      default: 'Other',
    },
    nativeContactId: {
      type: String,
      trim: true,
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'syncing', 'synced', 'failed'],
      default: 'synced',
    },
    source: {
      type: String,
      default: 'business_card',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and user-data isolation
contactSchema.index({ userId: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ phone: 1 });
// Compound text index for name, company, email, phone search queries
contactSchema.index({ name: 'text', company: 'text', designation: 'text', email: 'text' });

export const Contact = model('Contact', contactSchema);
