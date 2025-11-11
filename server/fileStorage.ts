import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface StoredFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  compressedSize: number;
  path: string;
  compressed: boolean;
  createdAt: Date;
  userId: string;
}

export class FileStorageService {
  private baseDir: string;
  private resumesDir: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private allowedMimeTypes: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  constructor() {
    // Use persistent storage for both development and production
    // In VM deployments, ensure this directory persists across restarts
    this.baseDir = process.env.RESUME_STORAGE_PATH || './uploads';
    this.resumesDir = path.join(this.baseDir, 'resumes');
    
    console.log(`📁 FileStorage initialized: ${this.resumesDir}`);
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await access(this.baseDir);
      console.log(`✅ Base directory exists: ${this.baseDir}`);
    } catch {
      await mkdir(this.baseDir, { recursive: true });
      console.log(`📂 Created base directory: ${this.baseDir}`);
    }

    try {
      await access(this.resumesDir);
      console.log(`✅ Resumes directory exists: ${this.resumesDir}`);
    } catch {
      await mkdir(this.resumesDir, { recursive: true });
      console.log(`📂 Created resumes directory: ${this.resumesDir}`);
    }
  }

  async storeResume(file: Express.Multer.File, userId: string): Promise<StoredFile> {
    // Validate file
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Generate unique file ID
    const fileId = `resume_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${fileId}${fileExtension}`; // NO compression - store original
    const filePath = path.join(this.resumesDir, fileName);

    // Store original file WITHOUT compression to preserve PDF structure and design
    // This ensures recruiters see the EXACT original resume
    await writeFile(filePath, file.buffer);

    const storedFile: StoredFile = {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      compressedSize: file.size, // Same as original since no compression
      path: filePath,
      compressed: false, // NO compression
      createdAt: new Date(),
      userId,
    };

    console.log(`📄 Resume stored (ORIGINAL): ${file.originalname} (${file.size} bytes, NO compression to preserve design)`);
    
    return storedFile;
  }

  async retrieveResume(fileId: string, userId: string): Promise<Buffer | null> {
    try {
      console.log(`[FILE_STORAGE] Retrieving resume: ${fileId} for user: ${userId}`);
      
      // SECURITY: Validate fileId matches userId to prevent unauthorized access
      if (!fileId.startsWith(`resume_${userId}_`)) {
        console.error(`[SECURITY] FileId ${fileId} does not belong to user ${userId}`);
        return null;
      }

      // For security, ensure the file belongs to the user
      const fileInfo = await this.getFileInfo(fileId, userId);
      if (!fileInfo) {
        console.error(`[FILE_STORAGE] File info not found for ${fileId}`);
        return null;
      }

      console.log(`[FILE_STORAGE] Reading file from: ${fileInfo.path}`);
      const fileBuffer = await readFile(fileInfo.path);
      
      // Decompress if necessary
      if (fileInfo.compressed) {
        console.log(`[FILE_STORAGE] Decompressing file ${fileId}`);
        return await gunzip(fileBuffer);
      }
      
      return fileBuffer;
    } catch (error) {
      console.error(`[FILE_STORAGE] Error retrieving file ${fileId}:`, error);
      return null;
    }
  }

  async deleteResume(fileId: string, userId: string): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(fileId, userId);
      if (!fileInfo) {
        return false;
      }

      await fs.promises.unlink(fileInfo.path);
      console.log(`[FILE_STORAGE] Deleted resume ${fileId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`[FILE_STORAGE] Error deleting file ${fileId}:`, error);
      return false;
    }
  }

  private async getFileInfo(fileId: string, userId: string): Promise<StoredFile | null> {
    // In a production environment, this would query a database
    // For now, we'll reconstruct the file path and check if it exists
    const possibleExtensions = ['.pdf', '.doc', '.docx', '.txt', '']; // Added empty string for files without extension
    
    for (const ext of possibleExtensions) {
      const fileName = `${fileId}${ext}`;
      const filePath = path.join(this.resumesDir, fileName);
      const compressedPath = `${filePath}.gz`;
      
      try {
        // Check compressed version first
        await access(compressedPath);
        const stats = await fs.promises.stat(compressedPath);
        return {
          id: fileId,
          originalName: `resume${ext || '.pdf'}`, // Default to PDF if no extension
          mimeType: this.getMimeTypeFromExtension(ext || '.pdf'),
          size: 0, // Would be stored in database
          compressedSize: stats.size,
          path: compressedPath,
          compressed: true,
          createdAt: stats.birthtime,
          userId
        };
      } catch {
        // Try uncompressed version
        try {
          await access(filePath);
          const stats = await fs.promises.stat(filePath);
          return {
            id: fileId,
            originalName: `resume${ext || '.pdf'}`,
            mimeType: this.getMimeTypeFromExtension(ext || '.pdf'),
            size: stats.size,
            compressedSize: stats.size,
            path: filePath,
            compressed: false,
            createdAt: stats.birthtime,
            userId
          };
        } catch {
          continue;
        }
      }
    }
    
    return null;
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private getMimeTypeFromExtension(ext: string): string {
    const mimeMap: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async storeResumeBuffer(buffer: Buffer, fileName: string, userId: string, mimeType: string = 'application/pdf'): Promise<StoredFile> {
    // Validate buffer size
    if (buffer.length > this.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Generate unique file ID
    const fileId = `resume_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = this.getFileExtension(fileName);
    const storedFileName = `${fileId}${fileExtension}.gz`; // Add .gz for compressed files
    const filePath = path.join(this.resumesDir, storedFileName);

    // Compress file data to save space
    const compressedData = await gzip(buffer);
    await writeFile(filePath, compressedData);

    const storedFile: StoredFile = {
      id: fileId,
      originalName: fileName,
      mimeType: mimeType,
      size: buffer.length,
      compressedSize: compressedData.length,
      path: filePath,
      compressed: true,
      createdAt: new Date(),
      userId,
    };

    console.log(`📄 Resume buffer stored: ${fileName} (${buffer.length} bytes → ${compressedData.length} bytes, ${((1 - compressedData.length / buffer.length) * 100).toFixed(1)}% compression)`);
    
    return storedFile;
  }

  // Cloud storage methods for production deployment
  async uploadToCloud(fileBuffer: Buffer, fileName: string): Promise<string> {
    // TODO: Implement cloud storage upload (AWS S3, Google Cloud Storage, etc.)
    // This would be used in production with proper cloud credentials
    throw new Error('Cloud storage not implemented. Configure AWS S3 or similar service.');
  }

  async downloadFromCloud(fileName: string): Promise<Buffer> {
    // TODO: Implement cloud storage download
    throw new Error('Cloud storage not implemented. Configure AWS S3 or similar service.');
  }

  // Get storage statistics
  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    // This would query the database in production
    return {
      totalFiles: 0,
      totalSize: 0,
      compressedSize: 0,
      compressionRatio: 0
    };
  }
}

export const fileStorage = new FileStorageService();