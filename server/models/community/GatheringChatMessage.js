const mongoose = require('mongoose');

const gatheringChatMessageSchema = new mongoose.Schema(
  {
    gatheringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SanghaEvent',
      required: [true, 'Gathering ID is required'],
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

gatheringChatMessageSchema.index({ gatheringId: 1, createdAt: 1 });

module.exports = mongoose.model('GatheringChatMessage', gatheringChatMessageSchema);
