/**
 * Centralized Media CDN URL Resolver
 * Resolves media object keys and legacy storage paths to CDN or local URLs deterministically.
 */

export interface MediaItemLike {
  storagePath?: string | null;
  thumbnailPath?: string | null;
  storageProvider?: string | null;
  visibility?: string | null;
  url?: string | null;
}

export function getMediaCdnUrl(input: string | MediaItemLike | null | undefined): string {
  if (!input) {
    return '';
  }

  let pathStr = '';
  let isMinioProvider = false;
  let isPrivate = false;

  if (typeof input === 'string') {
    pathStr = input;
  } else if (typeof input === 'object') {
    pathStr = input.storagePath || input.thumbnailPath || input.url || '';
    isMinioProvider = input.storageProvider === 'S3' || input.storageProvider === 'MINIO';
    isPrivate = input.visibility === 'PRIVATE';
  }

  if (!pathStr || typeof pathStr !== 'string') {
    return '';
  }

  const trimmed = pathStr.trim();
  if (!trimmed) {
    return '';
  }

  // If URL is already absolute, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }

  // Strip leading legacy prefix (e.g. /uploads/, /api/files/, leading slashes)
  const cleanKey = trimmed
    .replace(/^(\/|\\)+/, '')
    .replace(/^uploads(\/|\\)/i, '')
    .replace(/^api(\/|\\)files(\/|\\)/i, '')
    .replace(/\\/g, '/');

  const cdnBase = (process.env.MEDIA_CDN_URL || 'https://media.finalattemptias.com').replace(/\/+$/, '');

  // If explicitly local provider without CDN requirement, keep local path format
  if (typeof input === 'object' && input.storageProvider === 'LOCAL' && !isMinioProvider) {
    return `/${trimmed.replace(/^(\/|\\)+/, '')}`;
  }

  return `${cdnBase}/${cleanKey}`;
}

export function sanitizeObjectKey(key: string): string {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid object key: key must be a non-empty string');
  }

  // Reject path traversal attempts, Windows drive letters, or null bytes
  if (key.includes('..') || key.includes('\0') || /^[a-zA-Z]:/.test(key)) {
    throw new Error(`Security Violation: Invalid or dangerous object key: ${key}`);
  }

  // Normalize path separators and remove leading slashes
  const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) {
    throw new Error('Invalid object key: key cannot be empty');
  }

  return normalized;
}

export function resolveMediaItem(item: MediaItemLike | string | null | undefined): {
  url: string;
  cdnUrl: string;
  isMinio: boolean;
  isPrivate: boolean;
} {
  const cdnUrl = getMediaCdnUrl(item);
  let url = cdnUrl;
  let isMinio = false;
  let isPrivate = false;

  if (typeof item === 'object' && item !== null) {
    isMinio = item.storageProvider === 'S3' || item.storageProvider === 'MINIO';
    isPrivate = item.visibility === 'PRIVATE';
    if (!isMinio && item.storagePath) {
      const rawPath = item.storagePath.replace(/^(\/|\\)+/, '');
      url = `/${rawPath}`;
    }
  }

  return {
    url,
    cdnUrl,
    isMinio,
    isPrivate,
  };
}
