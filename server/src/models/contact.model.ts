
import { Schema, model } from 'mongoose';

const phoneSchema = new Schema({
  value: { type: String, required: true, trim: true },
  type: { type: String, trim: true, default: 'mobile' },
  label: { type: String, trim: true },
}, { _id: false });

const emailSchema = new Schema({
  value: { type: String, required: true, trim: true, lowercase: true },
  type: { type: String, trim: true, default: 'work' },
}, { _id: false });

const websiteSchema = new Schema({
  value: { type: String, required: true, trim: true },
  type: { type: String, trim: true, default: 'work' },
}, { _id: false });

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
    phones: {
      type: [phoneSchema],
      default: [],
    },
    emails: {
      type: [emailSchema],
      default: [],
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
    websites: {
      type: [websiteSchema],
      default: [],
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
    extractionQualityScore: {
      type: Number,
      min: [0, 'Extraction quality score must be at least 0'],
      max: [100, 'Extraction quality score cannot exceed 100'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and user-data isolation
contactSchema.index({ userId: 1 });
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ 'emails.value': 1 });
contactSchema.index({ 'phones.value': 1 });
// Compound text index for name, company, email, phone search queries
contactSchema.index({ name: 'text', company: 'text', designation: 'text', 'emails.value': 'text' });

export const Contact = model('Contact', contactSchema);