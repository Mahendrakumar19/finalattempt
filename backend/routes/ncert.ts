import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

/**
 * Recursive folder tree builder helper
 */
async function buildFolderTree(folderId: string | null = null): Promise<any[]> {
  const folders = await prisma.mediaFolder.findMany({
    where: { parentId: folderId },
    orderBy: { name: 'asc' },
    include: {
      mediaItems: {
        where: { deletedAt: null },
        orderBy: { title: 'asc' }
      }
    }
  });

  const result = [];

  for (const f of folders) {
    const children = await buildFolderTree(f.id);
    result.push({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      filesCount: f.mediaItems.length,
      files: f.mediaItems.map(m => ({
        id: m.id,
        title: m.title,
        originalName: m.originalName,
        fileName: m.fileName,
        size: m.size ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
        type: m.extension?.toUpperCase() || m.fileType || 'PDF',
        url: m.storagePath,
        createdAt: m.createdAt
      })),
      children
    });
  }

  return result;
}

/**
 * Get or create folder by path (e.g. ["NCERT Books", "Geography", "Class 11"])
 */
async function getOrCreateFolderByPath(pathParts: string[]): Promise<string | null> {
  let currentParentId: string | null = null;

  for (const part of pathParts) {
    const cleanName = part.trim();
    if (!cleanName) continue;

    let folder = await prisma.mediaFolder.findFirst({
      where: {
        name: cleanName,
        parentId: currentParentId
      }
    });

    if (!folder) {
      folder = await prisma.mediaFolder.create({
        data: {
          name: cleanName,
          parentId: currentParentId
        }
      });
    }

    currentParentId = folder.id;
  }

  return currentParentId;
}

/**
 * GET /api/ncert/tree
 * Returns full automatic hierarchical folder tree for NCERT & Downloads
 */
router.get('/tree', async (req: Request, res: Response) => {
  try {
    const rootName = (req.query.root as string) || 'NCERT Books';
    
    // Find or return root folder
    let rootFolder = await prisma.mediaFolder.findFirst({
      where: { name: rootName, parentId: null }
    });

    if (!rootFolder) {
      // Auto-initialize default root
      rootFolder = await prisma.mediaFolder.create({
        data: { name: rootName, parentId: null }
      });
    }

    const tree = await buildFolderTree(rootFolder.id);

    // Also include root level files
    const rootFiles = await prisma.media.findMany({
      where: { folderId: rootFolder.id, deletedAt: null },
      orderBy: { title: 'asc' }
    });

    res.json({
      success: true,
      data: {
        id: rootFolder.id,
        name: rootFolder.name,
        files: rootFiles.map(m => ({
          id: m.id,
          title: m.title,
          originalName: m.originalName,
          fileName: m.fileName,
          size: m.size ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
          type: m.extension?.toUpperCase() || m.fileType || 'PDF',
          url: m.storagePath,
          createdAt: m.createdAt
        })),
        children: tree
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ncert/auto-upload
 * Auto creates folders (e.g. Subject -> Class -> Chapter) & attaches file
 */
router.post('/auto-upload', async (req: Request, res: Response) => {
  try {
    const { mediaId, rootName = 'NCERT Books', subject, className, chapterName } = req.body;

    if (!mediaId) {
      return res.status(400).json({ success: false, error: 'mediaId is required' });
    }

    const pathParts = [rootName];
    if (subject) pathParts.push(subject);
    if (className) pathParts.push(className);
    if (chapterName) pathParts.push(chapterName);

    const targetFolderId = await getOrCreateFolderByPath(pathParts);

    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: { folderId: targetFolderId }
    });

    res.json({
      success: true,
      data: updatedMedia,
      folderId: targetFolderId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
