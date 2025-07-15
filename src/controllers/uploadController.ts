import { Request, Response } from 'express'
import { supabase } from '../database/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const AUDIO_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'audio‑files'
const IMAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_IMAGE || 'images'
const AUDIO_FOLDER = process.env.SUPABASE_AUDIO_FOLDER || 'track'
const IMAGE_FOLDER = process.env.SUPABASE_IMAGES_FOLDER || 'covers'

export const uploadAudio = async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const ext = path.extname(file.originalname)
    const name = `${uuidv4()}${ext}`
    const filePath = `${AUDIO_FOLDER}/${name}`

    const { error: uploadError } = await supabase
      .storage
      .from(AUDIO_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (uploadError) {
      console.error('Audio upload error:', uploadError)
      return res.status(500).json({ error: 'Audio upload failed' })
    }

    const { data } = supabase
      .storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath)

    return res.status(200).json({ url: data.publicUrl })
  } catch (err) {
    console.error('Unexpected error in uploadAudio:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const ext = path.extname(file.originalname)
    const name = `${uuidv4()}${ext}`
    const filePath = `${IMAGE_FOLDER}/${name}`

    const { error: uploadError } = await supabase
      .storage
      .from(IMAGE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (uploadError) {
      console.error('Image upload error:', uploadError)
      return res.status(500).json({ error: 'Image upload failed' })
    }

    const { data } = supabase
      .storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(filePath)

    return res.status(200).json({ url: data.publicUrl })
  } catch (err) {
    console.error('Unexpected error in uploadImage:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
