import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // This line was missing
import File from '../models/File.js';

// --- HARD-CODED AWS CONFIGURATION ---
const AWS_CONFIG = {
  BUCKET_NAME: 'sanjayrawat30-file-storage',
  REGION: 'eu-north-1',
  ACCESS_KEY_ID: 'AKIA6JEITOUWNF65I2JS',
  SECRET_ACCESS_KEY: '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'
};

const s3Client = new S3Client({
  region: AWS_CONFIG.REGION,
  credentials: {
    accessKeyId: AWS_CONFIG.ACCESS_KEY_ID,
    secretAccessKey: AWS_CONFIG.SECRET_ACCESS_KEY,
  },
});

export const uploadFile = async (req, res) => {
  const file = req.file;
  const userId = req.user.id;
  const s3Key = `${userId}/${Date.now()}_${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: AWS_CONFIG.BUCKET_NAME,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);
    const fileUrl = `https://${AWS_CONFIG.BUCKET_NAME}.s3.${AWS_CONFIG.REGION}.amazonaws.com/${s3Key}`;
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
    const files = await File.find({ user: req.user.id }).select('fileName createdAt s3Key');
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

    if (!file.s3Key) {
      return res.status(400).json({ message: 'This file is an old record and cannot be downloaded. Please re-upload it.' });
    }

    const command = new GetObjectCommand({
      Bucket: AWS_CONFIG.BUCKET_NAME,
      Key: file.s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
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

    if (file.s3Key) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: AWS_CONFIG.BUCKET_NAME,
        Key: file.s3Key,
      });
      try {
        await s3Client.send(deleteCommand);
      } catch (s3Error) {
        console.error(`Could not delete file from S3 (Key: ${file.s3Key}). This might be an old record. Continuing to delete from database.`, s3Error);
      }
    } else {
      console.log(`No s3Key found for file record ${file._id}. Deleting from database only.`);
    }

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File record deleted successfully' });
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
      return res.status(404).json({ message: 'File not found or you do not have permission to rename it.' });
    }

    res.json({ message: 'File renamed successfully', data: updatedFile });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Server error while renaming file.' });
  }
};
