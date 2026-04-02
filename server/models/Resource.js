const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    fileType: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    faculty: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, trim: true }],
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    downloads: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true }
  },
  { timestamps: true }
);

resourceSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text', faculty: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
