import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// --- THIS IS THE SECRET KEY ---
const JWT_SECRET = '2474f9221155aeed6f471f0b133b0760a318c195b500e757b8b69bbe67b9e03a';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const changePassword = async (req, res) => {
  // The user's ID is available from the authMiddleware (req.user.id)
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // 1. Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      // This should not happen if the user is logged in
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Compare the provided current password with the one in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 4. Save the user with the new password
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/auth.js

// ... other imports

export const forgotPassword = async (req, res) => {
  let user; // <-- Declare user outside the try block
  try {
    user = await User.findOne({ email: req.body.email }); // <-- Assign user here
    if (!user) {
      return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Use the simpler 'Gmail' service for Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const resetURL = `http://localhost:5173/reset-password/${resetToken}`; // Use your frontend's URL
    const emailMessage = `Forgot your password? Click the link to reset it: ${resetURL}\nThis link is valid for 10 minutes. If you didn't request this, please ignore this email.`;

    await transporter.sendMail({
        from: '"CloudStore Support" <no-reply@cloudstore.com>',
        to: user.email,
        subject: 'Your Password Reset Link',
        text: emailMessage,
    });
    
    res.status(200).json({ message: 'A reset token has been sent to your email.' });

  } catch (err) {
    console.error(err);
    // --- THIS IS THE CORRECTED PART ---
    // Only try to clean up the token if the user was actually found before the error
    if (user) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    }
    // ---
    res.status(500).send('An error occurred while trying to send the password reset email.');
  }
};

// ... rest of your controller functions ...



// --- NEW: RESET PASSWORD FUNCTION ---
export const resetPassword = async (req, res) => {
    try {
        // 1. Get user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        // 2. If token has not expired, and there is a user, set the new password
        if (!user) {
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        user.password = await bcrypt.hash(req.body.password, 12);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // 3. Log the user in, send JWT
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, message: "Password reset successful." });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

