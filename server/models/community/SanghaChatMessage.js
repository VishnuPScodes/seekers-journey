const mongoose = require('mongoose');

const sanghaChatMessageSchema = new mongoose.Schema(
  {
    sanghaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sangha',
      required: [true, 'Sangha ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

sanghaChatMessageSchema.index({ sanghaId: 1, createdAt: 1 });

module.exports = mongoose.model('SanghaChatMessage', sanghaChatMessageSchema);
