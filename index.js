import 'dotenv/config';
// ... the rest of your index.js file


import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/file.js';
import contactRoutes from './routes/contact.js';
import encryptionRoutes from './routes/encryption.js';

const app = express();

// --- Database Connection ---
const connectDB = async () => {
  try {
    // This is already secure and correct. No changes needed here.
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
        process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB();
// -------------------------


// --- Middlewares ---

// FIX: Updated the allowedOrigins list with your new Netlify link.
const allowedOrigins = [
  'http://localhost:5173',
  'https://my-secure-cloud-storage.netlify.app' // This is your new, correct frontend URL
];

app.use(cors({
  origin: allowedOrigins, // Pass the array of allowed origins directly
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/encryption', encryptionRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
