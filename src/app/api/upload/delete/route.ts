// src/app/api/upload/delete/route.ts
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from 'next/server';

const BUCKET_NAME = process.env.NEXT_S3_BUCKET_NAME;
const S3_REGION = process.env.NEXT_S3_REGION;
const AWS_ACCESS_KEY = process.env.NEXT_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.NEXT_SECRET_ACCESS_KEY;

// Helper function to extract S3 key from URL
function extractS3Key(imageUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(imageUrl);
    
    // Handle different S3 URL formats:
    // 1. https://bucket-name.s3.region.amazonaws.com/folder/filename.ext
    // 2. https://s3.region.amazonaws.com/bucket-name/folder/filename.ext
    // 3. https://bucket-name.s3.amazonaws.com/folder/filename.ext
    
    if (url.hostname.startsWith(bucketName)) {
      // Format 1 & 3: bucket-name.s3.region.amazonaws.com
      return url.pathname.substring(1); // Remove leading slash
    } else if (url.hostname.includes('s3') && url.pathname.startsWith(`/${bucketName}/`)) {
      // Format 2: s3.region.amazonaws.com/bucket-name/
      return url.pathname.substring(`/${bucketName}/`.length);
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function DELETE(req: NextRequest) {
  // Check S3 configuration
  if (!BUCKET_NAME || !S3_REGION || !AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
    return NextResponse.json({ 
      success: false, 
      message: "S3 configuration is missing. Please check environment variables." 
    }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'Image URL is required.' 
      }, { status: 400 });
    }

    // Extract the S3 key from the URL
    const key = extractS3Key(imageUrl, BUCKET_NAME);
    
    if (!key) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid S3 URL format or could not extract key.' 
      }, { status: 400 });
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
      }
    });

    // Delete the object from S3
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully.',
      deletedKey: key
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting image from S3:', error);
    
    // Handle specific S3 errors
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ 
        success: false, 
        message: 'Image not found in S3.' 
      }, { status: 404 });
    }
    
    if (error.name === 'AccessDenied') {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied. Check S3 permissions.' 
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete image from S3.',
      error: error.message 
    }, { status: 500 });
  }
}
