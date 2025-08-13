// src/app/api/categories/image/route.ts
import connectDb from '@/lib/mongodb';
import Category from '@/models/Category';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = process.env.NEXT_S3_BUCKET_NAME;
const S3_REGION = process.env.NEXT_S3_REGION;
const AWS_ACCESS_KEY = process.env.NEXT_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.NEXT_SECRET_ACCESS_KEY;

// Helper function to extract S3 key from URL
function extractS3Key(imageUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(imageUrl);
    if (url.hostname.startsWith(bucketName)) {
      return url.pathname.substring(1);
    } else if (url.hostname.includes('s3') && url.pathname.startsWith(`/${bucketName}/`)) {
      return url.pathname.substring(`/${bucketName}/`.length);
    }
    return null;
  } catch {
    return null;
  }
}

// Initialize S3 client
function getS3Client() {
  if (!BUCKET_NAME || !S3_REGION || !AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
    throw new Error('S3 configuration is missing');
  }
  
  return new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_KEY,
    }
  });
}

// POST - Upload new category image
export async function POST(req: NextRequest) {
  try {
    // Check S3 configuration
    if (!BUCKET_NAME || !S3_REGION || !AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
      return NextResponse.json({ 
        success: false, 
        message: "S3 configuration is missing." 
      }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoryId = formData.get('categoryId') as string | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file provided.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `categories/${fileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const s3Client = getS3Client();
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate S3 URL
    const imageUrl = `https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;

    // If categoryId is provided, update the category with the new image
    if (categoryId) {
      await connectDb();
      
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        // Get the current category to delete old image if it exists
        const currentCategory = await Category.findById(categoryId);
        
        if (currentCategory && currentCategory.image) {
          // Delete old image from S3
          const oldKey = extractS3Key(currentCategory.image, BUCKET_NAME);
          if (oldKey) {
            try {
              await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: oldKey,
              }));
            } catch (error) {
              console.warn('Failed to delete old image:', error);
            }
          }
        }
        
        // Update category with new image
        await Category.findByIdAndUpdate(categoryId, { image: imageUrl });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Image uploaded successfully.',
      url: imageUrl,
      key: key
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to upload image.',
      error: error.message 
    }, { status: 500 });
  }
}

// PUT - Update category image
export async function PUT(req: NextRequest) {
  try {
    await connectDb();
    
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid category ID is required.' 
      }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file provided.' 
      }, { status: 400 });
    }

    // Use the POST logic to upload new image and update category
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('categoryId', categoryId);

    // Call the POST method internally
    const uploadRequest = new NextRequest('http://localhost/api/categories/image', {
      method: 'POST',
      body: uploadFormData
    });

    return await POST(uploadRequest);

  } catch (error: any) {
    console.error('Error updating category image:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update category image.',
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove category image
export async function DELETE(req: NextRequest) {
  try {
    await connectDb();
    
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const imageUrl = searchParams.get('imageUrl');
    
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid category ID is required.' 
      }, { status: 400 });
    }

    // Get the category
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category not found.' 
      }, { status: 404 });
    }

    const targetImageUrl = imageUrl || category.image;
    
    if (!targetImageUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'No image to delete.' 
      }, { status: 400 });
    }

    // Delete from S3 if configured
    if (BUCKET_NAME && S3_REGION && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
      const key = extractS3Key(targetImageUrl, BUCKET_NAME);
      
      if (key) {
        try {
          const s3Client = getS3Client();
          await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          }));
        } catch (error) {
          console.warn('Failed to delete image from S3:', error);
          // Continue with database update even if S3 deletion fails
        }
      }
    }

    // Remove image from category
    await Category.findByIdAndUpdate(categoryId, { $unset: { image: 1 } });

    return NextResponse.json({ 
      success: true, 
      message: 'Category image deleted successfully.' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting category image:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete category image.',
      error: error.message 
    }, { status: 500 });
  }
}
