import { Request, Response } from 'express'
import { supabase } from '../database/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export const uploadAudio = async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const fileExt = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExt}`
    const filePath = `${process.env.SUPABASE_AUDIO_FOLDER}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET_AUDIO as string)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Audio upload failed' })
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET_AUDIO as string)
      .getPublicUrl(filePath)

    return res.status(200).json({ url: publicUrlData?.publicUrl })
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const fileExt = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExt}`
    const filePath = `${process.env.SUPABASE_IMAGES_FOLDER}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET_IMAGE as string)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Image upload failed' })
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET_IMAGE as string)
      .getPublicUrl(filePath)

    return res.status(200).json({ url: publicUrlData?.publicUrl })
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
