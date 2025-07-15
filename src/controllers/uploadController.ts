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

export const uploadTrackFiles = async (req: Request, res: Response) => {
  try {
    const audioFile = (req.files as any)?.audio?.[0]
    const imageFile = (req.files as any)?.image?.[0]

    if (!audioFile || !imageFile) {
      return res.status(400).json({ error: 'Both audio and image files are required' })
    }

    const audioExt = path.extname(audioFile.originalname)
    const imageExt = path.extname(imageFile.originalname)

    const audioFileName = `${uuidv4()}${audioExt}`
    const imageFileName = `${uuidv4()}${imageExt}`

    const audioPath = `${process.env.SUPABASE_AUDIO_FOLDER}/${audioFileName}`
    const imagePath = `${process.env.SUPABASE_IMAGES_FOLDER}/${imageFileName}`

    // Upload both files in parallel
    const [
      { error: audioError },
      { error: imageError }
    ] = await Promise.all([
      supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_AUDIO as string)
        .upload(audioPath, audioFile.buffer, {
          contentType: audioFile.mimetype,
          upsert: true
        }),
      supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_IMAGE as string)
        .upload(imagePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: true
        })
    ])

    if (audioError || imageError) {
      return res.status(500).json({
        error: 'Failed to upload one or more files',
        audioError,
        imageError
      })
    }

    const audioPublic = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET_AUDIO as string)
      .getPublicUrl(audioPath).data.publicUrl

    const imagePublic = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET_IMAGE as string)
      .getPublicUrl(imagePath).data.publicUrl

    return res.status(200).json({
      audioUrl: audioPublic,
      imageUrl: imagePublic
    })
  } catch (err) {
    console.error('uploadTrackFiles error:', err)
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}
