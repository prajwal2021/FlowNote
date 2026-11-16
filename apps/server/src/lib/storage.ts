import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { Readable } from 'node:stream';

const globalForS3 = globalThis as unknown as { flownoteS3?: S3Client };

function client(): S3Client {
  if (!globalForS3.flownoteS3) {
    const endpoint = process.env.S3_ENDPOINT_URL;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('S3_ENDPOINT_URL, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required');
    globalForS3.flownoteS3 = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'garage',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return globalForS3.flownoteS3;
}

function bucket(): string {
  return process.env.S3_BUCKET ?? 'flownote-files';
}

const ID = /^[0-9a-f-]{36}$/;

export function shareKey(id: string): string {
  if (!ID.test(id)) throw new Error('bad share id');
  return `shares/${id}`;
}

const GUIDE_EXTENSIONS = { html: 'html', bundle: 'flownote', snapshot: 'snap' } as const;

export function guideKey(id: string, part: keyof typeof GUIDE_EXTENSIONS): string {
  if (!ID.test(id)) throw new Error('bad guide id');
  return `guides/${id}.${GUIDE_EXTENSIONS[part]}`;
}

export async function putObject(key: string, body: Readable | Buffer, contentType: string): Promise<void> {
  await new Upload({
    client: client(),
    params: { Bucket: bucket(), Key: key, Body: body, ContentType: contentType },
    queueSize: 2,
    partSize: 8 * 1024 * 1024,
  }).done();
}

export async function getObject(key: string): Promise<{ body: ReadableStream; size: number } | null> {
  try {
    const result = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!result.Body) return null;
    return { body: result.Body.transformToWebStream() as ReadableStream, size: result.ContentLength ?? 0 };
  } catch (error) {
    if ((error as { name?: string }).name === 'NoSuchKey') return null;
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })).catch(() => undefined);
}

export function publicUrl(): string {
  return (process.env.PUBLIC_URL ?? 'http://localhost:3100').replace(/\/$/, '');
}
