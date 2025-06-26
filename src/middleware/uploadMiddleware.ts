import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Extend Express Request interface to include 'user'
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id?: string;
      [key: string]: any;
    };
  }
}

import { Request } from 'express';

// Configure AWS S3Client (SDK v3) with spread syntax for credentials
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        } as { accessKeyId: string; secretAccessKey: string }
      }
    : {})
});

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'audio') {
    // Audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for audio field'));
    }
  } else if (file.fieldname === 'image' || file.fieldname === 'cover' || file.fieldname === 'avatar' || file.fieldname === 'banner') {
    // Image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for image fields'));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
};

// S3 upload configuration
const s3Upload = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME!,
  acl: 'public-read',
  metadata: (_req: Request, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      uploadedBy: _req.user?.id || 'anonymous',
      uploadedAt: new Date().toISOString()
    });
  },
  key: (_req: Request, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    let folder = '';
    if (file.fieldname === 'audio') {
      folder = process.env.S3_AUDIO_FOLDER || 'audio';
    } else {
      folder = process.env.S3_IMAGES_FOLDER || 'images';
    }
    
    cb(null, `${folder}/${fileName}`);
  }
});

// Multer configuration
export const upload = multer({
  storage: s3Upload,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 5 // Max 5 files per request
  }
});

// Specific upload configurations
export const uploadAudio = upload.single('audio');
export const uploadImage = upload.single('image');
export const uploadCover = upload.single('cover');
export const uploadAvatar = upload.single('avatar');
export const uploadBanner = upload.single('banner');

export const uploadTrackFiles = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);

export const uploadAlbumFiles = upload.fields([
  { name: 'cover', maxCount: 1 }
]);

export const uploadArtistFiles = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// Helper function to delete files from S3
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash
    // Use AWS SDK v3 command for deleting objects
    // Import DeleteObjectCommand at the top: import { DeleteObjectCommand } from '@aws-sdk/client-s3';
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key
    }));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};