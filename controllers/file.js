// controllers/file.js (Secure Version)

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import File from '../models/File.js';

// FIX: Initialize the S3 client securely using environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// FIX: Get the bucket name from environment variables as well
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const uploadFile = async (req, res) => {
  const file = req.file;
  const userId = req.user.id;
  const s3Key = `${userId}/${Date.now()}_${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME, // Use the environment variable
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const newFile = new File({
      fileName: file.originalname,
      s3Key: s3Key,
      fileUrl: fileUrl,
      user: userId,
    });
    await newFile.save();
    res.status(201).json({ message: 'File uploaded successfully', data: newFile });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    res.status(500).json({ message: 'Server error during file upload.' });
  }
};

export const getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ data: files });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFileDownloadUrl = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME, // Use the environment variable
      Key: file.s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minute expiry
    res.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'File not found' });
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME, // Use the environment variable
      Key: file.s3Key,
    });
    await s3Client.send(deleteCommand);

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error during file deletion process:', error);
    res.status(500).json({ message: 'Server error during file deletion.' });
  }
};

export const renameFile = async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;
  const userId = req.user.id;

  if (!newName || newName.trim() === '') {
    return res.status(400).json({ message: 'File name cannot be empty' });
  }

  try {
    const updatedFile = await File.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { fileName: newName } },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: 'File not found or you do not have permission.' });
    }

    res.json({ message: 'File renamed successfully', data: updatedFile });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Server error while renaming file.' });
  }
};
