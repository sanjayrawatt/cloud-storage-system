// controllers/encryptionController.js

import User from '../models/User.js';
import File from '../models/File.js';
import bcrypt from 'bcryptjs';

// Controller to check if the user has an encryption key set
export const checkEncryptionKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+encryptionKey');
    res.json({ hasKey: !!user.encryptionKey });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to set the encryption key for the first time
export const setEncryptionKey = async (req, res) => {
  const { key } = req.body;
  if (!key || key.length < 6) {
    return res.status(400).json({ message: 'Encryption key must be at least 6 characters long.' });
  }
  try {
    const user = await User.findById(req.user.id).select('+encryptionKey');
    if (user.encryptionKey) {
      return res.status(400).json({ message: 'Encryption key is already set.' });
    }
    user.encryptionKey = await bcrypt.hash(key, 12);
    await user.save();
    res.status(200).json({ message: 'Encryption key set successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to change the encryption key
export const changeEncryptionKey = async (req, res) => {
  const { oldKey, newKey } = req.body;
  if (!oldKey || !newKey || newKey.length < 6) {
    return res.status(400).json({ message: 'Both old and new keys are required, and the new key must be at least 6 characters.' });
  }
  try {
    const user = await User.findById(req.user.id).select('+encryptionKey');
    const isMatch = await bcrypt.compare(oldKey, user.encryptionKey);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect old encryption key.' });
    }
    user.encryptionKey = await bcrypt.hash(newKey, 12);
    await user.save();
    res.status(200).json({ message: 'Encryption key changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to verify the key before performing an action
export const verifyEncryptionKey = async (req, res) => {
  const { key } = req.body;
  try {
    const user = await User.findById(req.user.id).select('+encryptionKey');
    if (!user.encryptionKey) {
        return res.status(400).json({ message: 'Encryption key not set.' });
    }
    const isMatch = await bcrypt.compare(key, user.encryptionKey);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid encryption key.' });
    }
    res.status(200).json({ success: true, message: 'Key verified.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller for the secure account reset
export const resetEncryptionAccount = async (req, res) => {
  const { accountPassword } = req.body;
  if (!accountPassword) {
    return res.status(400).json({ message: 'Account password is required to confirm this action.' });
  }
  try {
    const user = await User.findById(req.user.id).select('+password +encryptionKey');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(accountPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect account password.' });
    }
    await File.deleteMany({ user: req.user.id });
    user.encryptionKey = undefined;
    await user.save();
    res.status(200).json({ message: 'Your encrypted files have been permanently deleted and your encryption key has been reset.' });
  } catch (err) {
    console.error('Error during account reset:', err.message);
    res.status(500).send('Server Error during account reset.');
  }
};
