import * as Minio from 'minio';
import { getMediaCdnUrl, sanitizeObjectKey } from './urlResolver';

export type MinioErrorCode =
  | 'CONNECTION_ERROR'
  | 'BUCKET_ERROR'
  | 'OBJECT_NOT_FOUND'
  | 'SECURITY_ERROR'
  | 'OPERATION_FAILED';

export class MinioStorageError extends Error {
  public code: MinioErrorCode;
  public details?: any;

  constructor(message: string, code: MinioErrorCode, details?: any) {
    super(message);
    this.name = 'MinioStorageError';
    this.code = code;
    this.details = details;
  }
}

export class MinioStorageService {
  private client: Minio.Client;
  public publicBucket: string;
  public privateBucket: string;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT || '38.242.244.225';
    const port = Number(process.env.MINIO_PORT || 9000);
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'finalattempt_s3_admin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'FinalAttemptS3@2026Secure';

    this.publicBucket = process.env.MINIO_PUBLIC_BUCKET || 'media-public';
    this.privateBucket = process.env.MINIO_PRIVATE_BUCKET || 'media-private';

    try {
      this.client = new Minio.Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      });
    } catch (err: any) {
      throw new MinioStorageError(
        `Failed to initialize MinIO Client: ${err.message}`,
        'CONNECTION_ERROR',
        err
      );
    }
  }

  public isEnabled(): boolean {
    return process.env.MINIO_ENABLED === 'true';
  }

  private getBucketName(isPrivate: boolean = false): string {
    return isPrivate ? this.privateBucket : this.publicBucket;
  }

  public async ensureBucketsExist(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const buckets = [this.publicBucket, this.privateBucket];
      for (const bucket of buckets) {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket, 'us-east-1');
          if (bucket === this.publicBucket) {
            // Set public read policy for media-public
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: '*',
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${this.publicBucket}/*`],
                },
              ],
            };
            await this.client.setBucketPolicy(this.publicBucket, JSON.stringify(policy));
          }
        }
      }
    } catch (err: any) {
      throw new MinioStorageError(
        `Failed ensuring MinIO buckets exist: ${err.message}`,
        'BUCKET_ERROR',
        err
      );
    }
  }

  public async uploadBuffer(
    key: string,
    buffer: Buffer,
    mimeType: string = 'application/octet-stream',
    isPrivate: boolean = false
  ): Promise<{ key: string; bucket: string; url: string; size: number }> {
    const sanitizedKey = sanitizeObjectKey(key);
    const bucket = this.getBucketName(isPrivate);

    if (!this.isEnabled()) {
      return {
        key: sanitizedKey,
        bucket,
        url: this.getPublicUrl(sanitizedKey),
        size: buffer.length,
      };
    }

    try {
      const metaData = {
        'Content-Type': mimeType,
      };
      await this.client.putObject(bucket, sanitizedKey, buffer, buffer.length, metaData);

      const url = isPrivate
        ? await this.getPrivateUrl(sanitizedKey)
        : this.getPublicUrl(sanitizedKey);

      return {
        key: sanitizedKey,
        bucket,
        url,
        size: buffer.length,
      };
    } catch (err: any) {
      throw new MinioStorageError(
        `MinIO Upload Buffer Error for key '${sanitizedKey}': ${err.message}`,
        'OPERATION_FAILED',
        err
      );
    }
  }

  public async uploadObject(
    key: string,
    data: Buffer | string,
    mimeType: string = 'application/octet-stream',
    isPrivate: boolean = false
  ): Promise<{ key: string; bucket: string; url: string; size: number }> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    return this.uploadBuffer(key, buffer, mimeType, isPrivate);
  }

  public async getObject(key: string, isPrivate: boolean = false): Promise<NodeJS.ReadableStream> {
    const sanitizedKey = sanitizeObjectKey(key);
    const bucket = this.getBucketName(isPrivate);

    try {
      return await this.client.getObject(bucket, sanitizedKey);
    } catch (err: any) {
      if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
        throw new MinioStorageError(
          `MinIO Object '${sanitizedKey}' not found in bucket '${bucket}'`,
          'OBJECT_NOT_FOUND',
          err
        );
      }
      throw new MinioStorageError(
        `Failed to fetch object '${sanitizedKey}': ${err.message}`,
        'OPERATION_FAILED',
        err
      );
    }
  }

  public async statObject(
    key: string,
    isPrivate: boolean = false
  ): Promise<Minio.BucketItemStat> {
    const sanitizedKey = sanitizeObjectKey(key);
    const bucket = this.getBucketName(isPrivate);

    try {
      return await this.client.statObject(bucket, sanitizedKey);
    } catch (err: any) {
      if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
        throw new MinioStorageError(
          `MinIO Object '${sanitizedKey}' not found in bucket '${bucket}'`,
          'OBJECT_NOT_FOUND',
          err
        );
      }
      throw new MinioStorageError(
        `Failed to stat object '${sanitizedKey}': ${err.message}`,
        'OPERATION_FAILED',
        err
      );
    }
  }

  public async objectExists(key: string, isPrivate: boolean = false): Promise<boolean> {
    try {
      await this.statObject(key, isPrivate);
      return true;
    } catch (err: any) {
      if (err instanceof MinioStorageError && err.code === 'OBJECT_NOT_FOUND') {
        return false;
      }
      throw err;
    }
  }

  public async deleteObject(key: string, isPrivate: boolean = false): Promise<boolean> {
    if (!this.isEnabled()) return true;
    const sanitizedKey = sanitizeObjectKey(key);
    const bucket = this.getBucketName(isPrivate);

    try {
      await this.client.removeObject(bucket, sanitizedKey);
      return true;
    } catch (err: any) {
      throw new MinioStorageError(
        `Failed deleting object '${sanitizedKey}' from bucket '${bucket}': ${err.message}`,
        'OPERATION_FAILED',
        err
      );
    }
  }

  public getPublicUrl(key: string): string {
    const sanitizedKey = sanitizeObjectKey(key);
    return getMediaCdnUrl(sanitizedKey);
  }

  public async getPrivateUrl(key: string, expiresSeconds: number = 3600): Promise<string> {
    const sanitizedKey = sanitizeObjectKey(key);
    try {
      return await this.client.presignedGetObject(
        this.privateBucket,
        sanitizedKey,
        expiresSeconds
      );
    } catch (err: any) {
      throw new MinioStorageError(
        `Failed generating presigned URL for private key '${sanitizedKey}': ${err.message}`,
        'OPERATION_FAILED',
        err
      );
    }
  }
}

export const minioStorage = new MinioStorageService();
