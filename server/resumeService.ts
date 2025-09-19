// Resume Service - Handles resume upload, storage, and management for Chrome extension
import { Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import { userResumes, users, type InsertUserResume } from '@shared/schema';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { ResumeParser } from './resumeParser';

// Configure multer for resume file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

export class ResumeService {
  // Upload a new resume
  static async uploadResume(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { name, makeDefault = false, makeActive = false } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Extract text content using ResumeParser for proper PDF/DOC parsing
      const resumeParser = new ResumeParser();
      let resumeText = '';
      
      try {
        if (file.mimetype === 'text/plain') {
          resumeText = file.buffer.toString('utf-8');
        } else {
          // Use ResumeParser to extract text from PDF/DOC files
          const parsedData = await resumeParser.parseResumeFile(file.buffer, file.mimetype);
          // Combine all extracted text content for analysis
          resumeText = [
            parsedData.fullName || '',
            parsedData.email || '',
            parsedData.phone || '',
            parsedData.professionalTitle || '',
            parsedData.summary || '',
            (parsedData.skills || []).join(', '),
            (parsedData.workExperience || []).map(exp => 
              `${exp.title} at ${exp.company}: ${exp.description}`
            ).join('\n'),
            (parsedData.education || []).map(edu => 
              `${edu.degree} from ${edu.institution}`
            ).join('\n')
          ].filter(text => text.trim().length > 0).join('\n');
          
          // Fallback to basic text if parsing didn't extract much
          if (resumeText.trim().length < 50) {
            resumeText = file.buffer.toString('utf-8');
          }
        }
      } catch (error) {
        console.warn('Resume text extraction failed, using fallback:', error);
        resumeText = file.buffer.toString('utf-8');
      }

      // If making this the default, unset other defaults
      if (makeDefault) {
        await db.update(userResumes)
          .set({ isDefault: false })
          .where(eq(userResumes.userId, userId));
      }

      // If making this active, unset other active resumes
      if (makeActive) {
        await db.update(userResumes)
          .set({ isActive: false })
          .where(eq(userResumes.userId, userId));
      }

      // Store resume in database (Base64 encoded)
      const resumeData: InsertUserResume = {
        userId,
        name: name || file.originalname,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileData: file.buffer.toString('base64'),
        storageMethod: 'database',
        resumeText,
        isDefault: makeDefault,
        isActive: makeActive,
        timesUsed: 0
      };

      const [newResume] = await db.insert(userResumes)
        .values(resumeData)
        .returning();

      res.json({
        success: true,
        resume: {
          id: newResume.id,
          name: newResume.name,
          fileName: newResume.fileName,
          fileSize: newResume.fileSize,
          mimeType: newResume.mimeType,
          isDefault: newResume.isDefault,
          isActive: newResume.isActive,
          createdAt: newResume.createdAt
        }
      });
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(500).json({ error: 'Failed to upload resume' });
    }
  }

  // Get user's resumes
  static async getUserResumes(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const resumes = await db.select({
        id: userResumes.id,
        name: userResumes.name,
        fileName: userResumes.fileName,
        fileSize: userResumes.fileSize,
        mimeType: userResumes.mimeType,
        isDefault: userResumes.isDefault,
        isActive: userResumes.isActive,
        atsScore: userResumes.atsScore,
        timesUsed: userResumes.timesUsed,
        lastUsed: userResumes.lastUsed,
        lastAnalyzed: userResumes.lastAnalyzed,
        createdAt: userResumes.createdAt,
        updatedAt: userResumes.updatedAt
      })
      .from(userResumes)
      .where(eq(userResumes.userId, userId))
      .orderBy(desc(userResumes.createdAt));

      res.json({ success: true, resumes });
    } catch (error) {
      console.error('Get user resumes error:', error);
      res.status(500).json({ error: 'Failed to fetch resumes' });
    }
  }

  // Get active/default resume for extension
  static async getActiveResume(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // First try to get the default resume, then active, then most recent
      let resume = await db.select()
        .from(userResumes)
        .where(and(
          eq(userResumes.userId, userId),
          eq(userResumes.isDefault, true)
        ))
        .limit(1);

      if (!resume.length) {
        resume = await db.select()
          .from(userResumes)
          .where(and(
            eq(userResumes.userId, userId),
            eq(userResumes.isActive, true)
          ))
          .limit(1);
      }

      if (!resume.length) {
        resume = await db.select()
          .from(userResumes)
          .where(eq(userResumes.userId, userId))
          .orderBy(desc(userResumes.createdAt))
          .limit(1);
      }

      if (!resume.length) {
        return res.status(404).json({ error: 'No resume found' });
      }

      // Increment usage count
      await db.update(userResumes)
        .set({ 
          timesUsed: (resume[0].timesUsed || 0) + 1,
          lastUsed: new Date()
        })
        .where(eq(userResumes.id, resume[0].id));

      // Return resume as blob data for extension
      res.setHeader('Content-Type', resume[0].mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${resume[0].fileName}"`);
      
      // Convert base64 back to buffer
      const fileBuffer = Buffer.from(resume[0].fileData || '', 'base64');
      res.send(fileBuffer);

    } catch (error) {
      console.error('Get active resume error:', error);
      res.status(500).json({ error: 'Failed to fetch active resume' });
    }
  }

  // Set default resume for extension auto-upload
  static async setDefaultResume(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { resumeId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Unset all other defaults
      await db.update(userResumes)
        .set({ isDefault: false })
        .where(eq(userResumes.userId, userId));

      // Set the new default
      const [updatedResume] = await db.update(userResumes)
        .set({ isDefault: true })
        .where(and(
          eq(userResumes.userId, userId),
          eq(userResumes.id, parseInt(resumeId))
        ))
        .returning();

      if (!updatedResume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      res.json({ success: true, message: 'Default resume updated' });
    } catch (error) {
      console.error('Set default resume error:', error);
      res.status(500).json({ error: 'Failed to set default resume' });
    }
  }

  // Delete a resume
  static async deleteResume(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { resumeId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const [deletedResume] = await db.delete(userResumes)
        .where(and(
          eq(userResumes.userId, userId),
          eq(userResumes.id, parseInt(resumeId))
        ))
        .returning();

      if (!deletedResume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
      console.error('Delete resume error:', error);
      res.status(500).json({ error: 'Failed to delete resume' });
    }
  }
}

export const resumeUploadMiddleware = upload.single('resume');