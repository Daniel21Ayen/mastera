import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

@Injectable()
export class S3StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || 'mastera-private-assets';
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'mastera_s3_admin',
        secretAccessKey:
          process.env.S3_SECRET_KEY || 'mastera_s3_password_123',
      },
      forcePathStyle: true,
    });
  }

  /**
   * Generates a short-lived presigned download URL (15 minutes).
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds: number = 900
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Uploads an arbitrary binary buffer (e.g., encrypted/compressed .pkg archive) to MinIO/S3.
   */
  async uploadPackageBuffer(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream'
  ): Promise<{ key: string; sizeBytes: number }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.client.send(command);

    return {
      key,
      sizeBytes: buffer.byteLength,
    };
  }

  /**
   * Fetches raw object bytes from MinIO/S3 as Buffer.
   */
  async getObjectBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`S3 object body not found for key: ${key}`);
    }
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  /**
   * Streams object with optional HTTP Content-Range header support.
   */
  async getObjectStream(
    key: string,
    range?: string
  ): Promise<{
    stream: any;
    contentLength?: number | undefined;
    contentRange?: string | undefined;
    contentType?: string | undefined;
  }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Range: range,
    });
    const response = await this.client.send(command);
    return {
      stream: response.Body,
      contentLength: response.ContentLength,
      contentRange: response.ContentRange,
      contentType: response.ContentType,
    };
  }

  /**
   * Uploads receipt image after validating MIME and stripping EXIF privacy metadata (R19).
   */
  async uploadReceiptImage(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<{ key: string; sizeBytes: number }> {
    // Validate image & strip EXIF
    const sanitizedBuffer = await sharp(buffer)
      .rotate() // auto-orient based on EXIF before stripping
      .withMetadata({ exif: {} }) // strip EXIF metadata
      .toBuffer();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: sanitizedBuffer,
      ContentType: contentType,
    });

    await this.client.send(command);

    return {
      key,
      sizeBytes: sanitizedBuffer.byteLength,
    };
  }
}
