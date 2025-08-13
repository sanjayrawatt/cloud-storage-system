import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordResetToken: String,
  passwordResetExpires: Date,

  encryptionKey: {
    type: String,
    select: false // This prevents the key from being sent back in user queries by default
  }
});

export default mongoose.model('User', UserSchema);
