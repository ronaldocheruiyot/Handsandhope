import mongoose from 'mongoose';

const DirectMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, default: 'Message' },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'read'], default: 'sent' },
}, { timestamps: true });

const DirectMessage = mongoose.model('DirectMessage', DirectMessageSchema);
export default DirectMessage;
