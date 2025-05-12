// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const S3_REGION = process.env.AWS_S3_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!BUCKET_NAME || !S3_REGION || !AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
  console.error("AWS S3 configuration is missing in environment variables.");
  // For a production app, you might want to prevent startup or return an error immediately.
}

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY!,
    secretAccessKey: AWS_SECRET_KEY!,
  }
});

export async function POST(req: NextRequest) {
  if (!BUCKET_NAME || !S3_REGION || !AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
     return NextResponse.json({ success: false, message: "Server S3 configuration error." }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const params = {
      Bucket: BUCKET_NAME,
      Key: `products/${uniqueFileName}`, // Store files in a 'products' folder within the bucket
      Body: buffer,
      ContentType: file.type,
      // ACL: 'public-read', // Consider if images need to be publicly accessible via direct S3 URL.
                           // If serving through Next.js Image component, this might not be needed.
                           // And can have security implications if not desired.
    };

    await s3Client.send(new PutObjectCommand(params));
    
    // Construct the URL. Ensure your bucket policy allows GetObject for these files if using direct S3 URLs.
    // If using CloudFront or another CDN, this URL might be different.
    const fileUrl = `https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${params.Key}`;

    return NextResponse.json({ success: true, url: fileUrl }, { status: 200 });

  } catch (error) {
    console.error('Error uploading file to S3:', error);
    return NextResponse.json({ success: false, message: 'File upload failed.', error: (error as Error).message }, { status: 500 });
  }
}
