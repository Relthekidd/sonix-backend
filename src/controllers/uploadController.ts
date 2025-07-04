import { Response } from 'express';
import { AuthRequest } from '@/middleware/authMiddleware';
import { ArtistModel } from '@/models/Artist';
import { supabase } from '@/database/supabaseClient';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'sonix-music-files';
const AUDIO_FOLDER = process.env.SUPABASE_AUDIO_FOLDER || 'audio';
const IMAGES_FOLDER = process.env.SUPABASE_IMAGES_FOLDER || 'images';


export class UploadController {
  static async uploadAudio(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No audio file provided' });
      }

      // Verify user has artist profile
      const artist = await ArtistModel.findByUserId(req.user.id);
      if (!artist) {
        return res.status(403).json({ success: false, message: 'Artist profile required to upload audio' });
      }

      const filename = `${Date.now()}_${req.file.originalname}`;
      const path = `${AUDIO_FOLDER}/${filename}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

      if (error) {
        return res.status(500).json({ success: false, message: 'Supabase upload failed', error: error.message });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return res.status(201).json({
        success: true,
        message: 'Audio file uploaded successfully',
        data: {
          audioUrl: data.publicUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Upload audio error:', error);
      return res.status(500).json({
        success: false,
        message: 'Audio upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
      }

      const filename = `${Date.now()}_${req.file.originalname}`;
      const path = `${IMAGES_FOLDER}/${filename}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

      if (error) {
        return res.status(500).json({ success: false, message: 'Supabase upload failed', error: error.message });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl: data.publicUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Upload image error:', error);
      return res.status(500).json({
        success: false,
        message: 'Image upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async uploadTrackFiles(req: AuthRequest, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.audio || files.audio.length === 0) {
        return res.status(400).json({ success: false, message: 'Audio file is required' });
      }

      // Verify user has artist profile
      const artist = await ArtistModel.findByUserId(req.user.id);
      if (!artist) {
        return res.status(403).json({ success: false, message: 'Artist profile required to upload tracks' });
      }

      const audioFile = files.audio[0];
      if (!audioFile) {
        return res.status(400).json({ success: false, message: 'Audio file is missing or invalid' });
      }
      const coverFile = files.cover ? files.cover[0] : null;

      // Upload audio
      const audioFilename = `${Date.now()}_${audioFile.originalname}`;
      const audioPath = `${AUDIO_FOLDER}/${audioFilename}`;
      const { error: audioError } = await supabase.storage.from(BUCKET).upload(audioPath, audioFile.buffer, {
        contentType: audioFile.mimetype,
        upsert: false
      });
      if (audioError) {
        return res.status(500).json({ success: false, message: 'Supabase audio upload failed', error: audioError.message });
      }
      const { data: audioData } = supabase.storage.from(BUCKET).getPublicUrl(audioPath);

      // Upload cover (optional)
      let coverUrl = null;
      let coverMeta = null;
      if (coverFile) {
        const coverFilename = `${Date.now()}_${coverFile.originalname}`;
        const coverPath = `${IMAGES_FOLDER}/${coverFilename}`;
        const { error: coverError } = await supabase.storage.from(BUCKET).upload(coverPath, coverFile.buffer, {
          contentType: coverFile.mimetype,
          upsert: false
        });
        if (coverError) {
          return res.status(500).json({ success: false, message: 'Supabase cover upload failed', error: coverError.message });
        }
        const { data: coverData } = supabase.storage.from(BUCKET).getPublicUrl(coverPath);
        coverUrl = coverData.publicUrl;
        coverMeta = {
          filename: coverFilename,
          size: coverFile.size,
          mimetype: coverFile.mimetype
        };
      }

      return res.status(201).json({
        success: true,
        message: 'Track files uploaded successfully',
        data: {
          audioUrl: audioData.publicUrl,
          coverUrl,
          audio: {
            filename: audioFilename,
            size: audioFile.size,
            mimetype: audioFile.mimetype
          },
          cover: coverMeta
        }
      });
    } catch (error) {
      console.error('Upload track files error:', error);
      return res.status(500).json({
        success: false,
        message: 'Track files upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}