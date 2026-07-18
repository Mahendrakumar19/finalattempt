import { prisma } from '../prisma';
import { FileType, StorageProvider, Visibility, Prisma } from '@prisma/client';

export class MediaRepository {
  public async findMany(params: {
    search?: string;
    fileType?: FileType;
    folderId?: string | null;
    trash?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const { search, fileType, folderId, trash, limit = 20, offset = 0, sortBy = 'createdAt', order = 'desc' } = params;

    const where: Prisma.MediaWhereInput = {};

    // Handles soft-deleted (trash) files vs active files
    if (trash) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { originalName: { contains: search } },
        { fileName: { contains: search } }
      ];
    }

    const items = await prisma.media.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: order
      },
      include: {
        folder: true,
        usages: true
      }
    });

    return items;
  }

  public async count(params: {
    search?: string;
    fileType?: FileType;
    folderId?: string | null;
    trash?: boolean;
  }) {
    const { search, fileType, folderId, trash } = params;

    const where: Prisma.MediaWhereInput = {};

    if (trash) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { originalName: { contains: search } },
        { fileName: { contains: search } }
      ];
    }

    return prisma.media.count({ where });
  }

  public async findById(id: string) {
    return prisma.media.findUnique({
      where: { id },
      include: { folder: true, usages: true }
    });
  }

  public async findByChecksum(checksum: string) {
    return prisma.media.findFirst({
      where: { checksum, deletedAt: null },
      include: { folder: true }
    });
  }

  public async create(data: Prisma.MediaCreateInput) {
    return prisma.media.create({
      data,
      include: { folder: true }
    });
  }

  public async update(id: string, data: Prisma.MediaUncheckedUpdateInput) {
    return prisma.media.update({
      where: { id },
      data,
      include: { folder: true }
    });
  }

  public async delete(id: string, permanent: boolean = false) {
    if (permanent) {
      return prisma.media.delete({ where: { id } });
    } else {
      return prisma.media.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    }
  }

  public async restore(id: string) {
    return prisma.media.update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  // ─── Folders Operations ───────────────────────────────────────────────────
  public async findFolders(parentId: string | null = null) {
    return prisma.mediaFolder.findMany({
      where: { parentId },
      include: {
        children: true,
        _count: {
          select: { mediaItems: true }
        }
      }
    });
  }

  public async findFolderById(id: string) {
    return prisma.mediaFolder.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true
      }
    });
  }

  public async createFolder(name: string, parentId: string | null = null) {
    return prisma.mediaFolder.create({
      data: { name, parentId }
    });
  }

  public async updateFolder(id: string, name: string) {
    return prisma.mediaFolder.update({
      where: { id },
      data: { name }
    });
  }

  public async deleteFolder(id: string) {
    return prisma.mediaFolder.delete({ where: { id } });
  }

  // ─── Usage Tracking Operations ────────────────────────────────────────────
  public async getUsages(mediaId: string) {
    return prisma.mediaUsage.findMany({
      where: { mediaId }
    });
  }

  public async trackUsage(mediaId: string, entityType: string, entityId: string, fieldName: string) {
    // Prevent duplicates in usage maps
    const existing = await prisma.mediaUsage.findFirst({
      where: { mediaId, entityType, entityId, fieldName }
    });
    if (existing) return existing;

    return prisma.mediaUsage.create({
      data: { mediaId, entityType, entityId, fieldName }
    });
  }

  public async untrackUsage(mediaId: string, entityType: string, entityId: string, fieldName: string) {
    return prisma.mediaUsage.deleteMany({
      where: { mediaId, entityType, entityId, fieldName }
    });
  }
}

export const mediaRepository = new MediaRepository();
