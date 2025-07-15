import 'react-native-get-random-values';
import { Request, Response } from 'express';
import { supabaseAdmin } from '../database/supabaseClient';
import path from 'path';

const AUDIO_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_AUDIO!;
const IMAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_IMAGE!;
const AUDIO_FOLDER = process.env.SUPABASE_AUDIO_FOLDER!;
const IMAGE_FOLDER = process.env.SUPABASE_IMAGES_FOLDER!;

// Generate UUIDs using the built-in crypto API
const generateId = (): string => crypto.randomUUID();

// Handler: upload a single audio file
export const uploadAudio = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const ext = path.extname(file.originalname);
    const filename = `${generateId()}${ext}`;
    const filePath = `${AUDIO_FOLDER}/${filename}`;

    const { error: storageError } = await supabaseAdmin
      .storage
      .from(AUDIO_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (storageError) {
      console.error('Audio storage error:', storageError);
      return res.status(500).json({ success: false, error: 'Audio upload failed' });
    }

    const { data: urlData } = supabaseAdmin
      .storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath);

    return res.status(201).json({
      success: true,
      message: 'Audio uploaded successfully',
      data: {
        url: urlData.publicUrl,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (err: any) {
    console.error('uploadAudio error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Handler: upload a single image file
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const ext = path.extname(file.originalname);
    const filename = `${generateId()}${ext}`;
    const filePath = `${IMAGE_FOLDER}/${filename}`;

    const { error: storageError } = await supabaseAdmin
      .storage
      .from(IMAGE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (storageError) {
      console.error('Image storage error:', storageError);
      return res.status(500).json({ success: false, error: 'Image upload failed' });
    }

    const { data: urlData } = supabaseAdmin
      .storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(filePath);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: urlData.publicUrl,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (err: any) {
    console.error('uploadImage error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Handler: upload track audio + optional cover, then create a track record
export const uploadTrackFiles = async (req: Request, res: Response) => {
  try {
    const audioFile = (req.files as any)?.audio?.[0];
    const coverFile = (req.files as any)?.cover?.[0];

    if (!audioFile) {
      return res.status(400).json({ success: false, error: 'Audio file is required' });
    }

    // Upload audio to storage
    const audioExt = path.extname(audioFile.originalname);
    const audioName = `${generateId()}${audioExt}`;
    const audioPath = `${AUDIO_FOLDER}/${audioName}`;
    const { error: audioErr } = await supabaseAdmin
      .storage
      .from(AUDIO_BUCKET)
      .upload(audioPath, audioFile.buffer, {
        contentType: audioFile.mimetype,
        upsert: true,
      });
    if (audioErr) {
      console.error('Audio upload error:', audioErr);
      return res.status(500).json({ success: false, error: 'Audio upload failed' });
    }
    const { data: audioUrlData } = supabaseAdmin
      .storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(audioPath);
    const audioUrl = audioUrlData.publicUrl;

    // Upload cover if provided
    let coverUrl: string | null = null;
    let coverMeta = null;

    if (coverFile) {
      const coverExt = path.extname(coverFile.originalname);
      const coverName = `${generateId()}${coverExt}`;
      const coverPath = `${IMAGE_FOLDER}/${coverName}`;
      const { error: coverErr } = await supabaseAdmin
        .storage
        .from(IMAGE_BUCKET)
        .upload(coverPath, coverFile.buffer, {
          contentType: coverFile.mimetype,
          upsert: true,
        });
      if (coverErr) {
        console.error('Cover upload error:', coverErr);
        return res.status(500).json({ success: false, error: 'Cover upload failed' });
      }
      const { data: coverUrlData } = supabaseAdmin
        .storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(coverPath);
      coverUrl = coverUrlData.publicUrl;
      coverMeta = {
        filename: coverName,
        size: coverFile.size,
        mimetype: coverFile.mimetype,
      };
    }

    // Extract and validate meta fields
    const {
      title,
      artist_id,
      album_id,
      description,
      lyrics,
      genres,
      release_date,
      explicit,
    } = req.body;

    if (!title || !artist_id) {
      return res.status(400).json({ success: false, error: 'title and artist_id are required' });
    }

    // Build insert payload
    const payload: any = {
      id:           generateId(),
      title,
      audio_url:    audioUrl,
      cover_url:    coverUrl,
      artist_id,
      album_id:     album_id || null,
      description:  description || null,
      lyrics:       lyrics || null,
      genres:       genres ? genres.split(',').map((g: string) => g.trim()) : null,
      release_date: release_date || null,
      explicit:     explicit === 'true',
      is_published: false,
      created_at:   new Date().toISOString(),
    };

    const { data: track, error: insertErr } = await supabaseAdmin
      .from('tracks')
      .insert(payload)
      .select()
      .single();
    if (insertErr) {
      console.error('Track insert error:', insertErr);
      return res.status(500).json({ success: false, error: 'Track creation failed' });
    }

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Track created successfully',
      data: {
        track,
        audio: { filename: audioName, size: audioFile.size, mimetype: audioFile.mimetype },
        cover: coverMeta,
        audioUrl,
        coverUrl,
      },
    });
  } catch (err: any) {
    console.error('uploadTrackFiles error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
