import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_ENDPOINT } = process.env;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_ENDPOINT) {
  throw new Error('Missing required AWS S3 environment variables');
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  endpoint: AWS_S3_ENDPOINT, // e.g. https://xxxx.supabase.co/storage/v1/s3
  forcePathStyle: true, // Required for Supabase S3 compatibility
});

export const uploadToSupabaseS3 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(uploadParams);
  await s3.send(command);

  // Construct public URL (Supabase S3 style)
  return `https://${process.env.AWS_S3_BUCKET}.${process.env.AWS_S3_ENDPOINT?.replace(/^https?:\/\//, '')}/${key}`;
};