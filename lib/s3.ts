import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_S3_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY;

// Only pass explicit credentials if both are present; otherwise let the SDK
// resolve via its default provider chain (env/EC2/ECS, etc.)
export const s3Client = new S3Client({
  region,
  ...(accessKeyId && secretAccessKey
    ? { credentials: { accessKeyId, secretAccessKey } }
    : {}),
});
