import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin (server-side only)
let firebaseApp: any = null;
try {
  if (!getApps().length && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error);
}

let storage: any = null;
let bucket: any = null;

try {
  if (firebaseApp || getApps().length > 0) {
    storage = getStorage();
    bucket = storage.bucket();
  }
} catch (error) {
  console.warn('Firebase Storage initialization failed:', error);
}

/**
 * Upload PDF buffer to Firebase Storage
 * @param pdfBuffer - PDF file as Buffer
 * @param filename - Name of the file (e.g., "invoice-12345.pdf")
 * @param folder - Optional folder path (e.g., "invoices")
 * @returns Public download URL
 */
export async function uploadPDFToStorage(
  pdfBuffer: Buffer,
  filename: string,
  folder: string = 'invoices'
): Promise<string> {
  try {
    // Check if Firebase Storage is initialized
    if (!bucket) {
      throw new Error('Firebase Storage not initialized');
    }

    const filePath = `${folder}/${filename}`;
    const file = bucket.file(filePath);

    // Upload buffer to Firebase Storage
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          firebaseStorageDownloadTokens: generateToken(),
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading PDF to Firebase Storage:', error);
    throw new Error('Failed to upload PDF to cloud storage');
  }
}

/**
 * Delete PDF from Firebase Storage
 * @param fileUrl - Public URL of the file to delete
 */
export async function deletePDFFromStorage(fileUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split(`${bucket.name}/`);
    if (urlParts.length < 2 || !urlParts[1]) {
      throw new Error('Invalid file URL');
    }
    
    const filePath = urlParts[1];
    const file = bucket.file(filePath);

    // Delete file
    await file.delete();
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    console.error('Error deleting PDF from Firebase Storage:', error);
    throw new Error('Failed to delete PDF from cloud storage');
  }
}

/**
 * Get signed URL for private file access (expires in 1 hour)
 * @param filePath - Path to file in storage (e.g., "invoices/invoice-12345.pdf")
 * @returns Signed URL that expires in 1 hour
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  try {
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Check if file exists in storage
 * @param filePath - Path to file in storage
 * @returns Boolean indicating if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

/**
 * Generate a random token for Firebase Storage download
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export { bucket };
