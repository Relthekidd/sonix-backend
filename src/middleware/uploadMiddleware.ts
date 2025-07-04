import multer from 'multer';

// Use memory storage for multer
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 5
  }
});

export const uploadAudio = upload.single('audio');
export const uploadImage = upload.single('image');
export const uploadTrackFiles = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);