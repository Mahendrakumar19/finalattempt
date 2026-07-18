import { Request, Response } from 'express';
import { mediaRepository } from './media.repository';
import { mediaService } from './media.service';
import { FileType, Visibility } from '@prisma/client';

export class MediaController {
  
  public async getMedia(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string;
      const fileType = req.query.fileType as FileType;
      const folderId = req.query.folderId === 'null' ? null : (req.query.folderId as string || undefined);
      const trash = req.query.trash === 'true';
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const sortBy = req.query.sortBy as string || 'createdAt';
      const order = req.query.order as 'asc' | 'desc' || 'desc';

      const offset = (page - 1) * limit;

      const items = await mediaRepository.findMany({
        search,
        fileType,
        folderId,
        trash,
        limit,
        offset,
        sortBy,
        order
      });

      const total = await mediaRepository.count({
        search,
        fileType,
        folderId,
        trash
      });

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getMediaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await mediaRepository.findById(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Media asset not found.' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded.' });
        return;
      }

      const folderId = req.body.folderId === 'null' || !req.body.folderId ? null : req.body.folderId;
      const userId = (req as any).user?.id || null;

      const media = await mediaService.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId,
        folderId
      );

      res.status(201).json({ success: true, data: media });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async updateMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, visibility, folderId } = req.body;

      const updated = await mediaRepository.update(id, {
        title,
        description,
        visibility: visibility as Visibility,
        folderId: folderId === 'null' || !folderId ? null : folderId
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async renameMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        res.status(400).json({ success: false, error: 'Title is required' });
        return;
      }

      const updated = await mediaRepository.update(id, { title });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async replaceMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No replacement file provided.' });
        return;
      }

      const updated = await mediaService.replaceFile(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async moveMedia(req: Request, res: Response): Promise<void> {
    try {
      const { ids, folderId } = req.body;
      if (!Array.isArray(ids)) {
        res.status(400).json({ success: false, error: 'ids array is required.' });
        return;
      }

      const targetFolderId = folderId === 'null' || !folderId ? null : folderId;

      const updates = await Promise.all(
        ids.map(id => mediaRepository.update(id, { folderId: targetFolderId }))
      );

      res.json({ success: true, data: updates });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permanent = req.query.permanent === 'true';

      // Check usage tracking first
      const usages = await mediaRepository.getUsages(id);
      if (usages.length > 0 && !permanent) {
        res.status(409).json({
          success: false,
          error: `Asset is currently referenced in ${usages.length} pages. Deletion blocked to prevent broken layouts.`,
          usages
        });
        return;
      }

      const deleted = await mediaService.deleteFile(id, permanent);
      res.json({ success: true, data: deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async restoreMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restored = await mediaRepository.restore(id);
      res.json({ success: true, data: restored });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── Folders Endpoints ────────────────────────────────────────────────────
  public async getFolders(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.query.parentId === 'null' || !req.query.parentId ? null : req.query.parentId as string;
      const folders = await mediaRepository.findFolders(parentId);
      res.json({ success: true, data: folders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const { name, parentId } = req.body;
      if (!name) {
        res.status(400).json({ success: false, error: 'Folder name is required.' });
        return;
      }

      const targetParentId = parentId === 'null' || !parentId ? null : parentId;
      const folder = await mediaRepository.createFolder(name, targetParentId);
      res.status(201).json({ success: true, data: folder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async deleteFolder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await mediaRepository.deleteFolder(id);
      res.json({ success: true, message: 'Folder deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const mediaController = new MediaController();
