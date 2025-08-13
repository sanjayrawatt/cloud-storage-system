import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  s3Key: { type: String, required: true },
  fileUrl: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('File', FileSchema);
