import sharp from 'sharp';

export interface OptimizationOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'auto';
  width?: number;
  height?: number;
  stripMetadata?: boolean;
  generateThumbnails?: boolean;
  thumbnailSizes?: number[];
}

export interface OptimizationResult {
  optimized: File;
  thumbnails?: File[];
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
}

export class ImageOptimizer {
  private defaultOptions: OptimizationOptions = {
    quality: 85,
    format: 'webp',
    stripMetadata: true,
    generateThumbnails: true,
    thumbnailSizes: [150, 300, 600]
  };

  async optimize(file: File, options?: OptimizationOptions): Promise<OptimizationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const originalSize = file.size;

    const buffer = await file.arrayBuffer();
    let image = sharp(Buffer.from(buffer));

    image = image.rotate();

    if (opts.stripMetadata) {
      image = image.withMetadata();
    }

    let format = opts.format || 'webp';
    const metadata = await image.metadata();

    if (!format || format === 'auto') {
      format = this.detectOptimalFormat(metadata);
    }

    switch (format) {
      case 'webp':
        image = image.webp({ quality: opts.quality });
        break;
      case 'avif':
        image = image.avif({ quality: opts.quality });
        break;
      case 'jpeg':
        image = image.jpeg({ quality: opts.quality });
        break;
      case 'png':
        image = image.png({ quality: opts.quality });
        break;
    }

    if (opts.width || opts.height) {
      image = image.resize(opts.width, opts.height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    const optimizedBuffer = await image.toBuffer();
    const optimizedSize = optimizedBuffer.length;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    const optimizedArrayBuffer = (optimizedBuffer.buffer as ArrayBuffer).slice(
      optimizedBuffer.byteOffset,
      optimizedBuffer.byteOffset + optimizedBuffer.byteLength
    );
    const optimizedFile = new File([optimizedArrayBuffer], this.getOptimizedFileName(file.name, format), {
      type: `image/${format}`
    });

    const result: OptimizationResult = {
      optimized: optimizedFile,
      originalSize,
      optimizedSize,
      compressionRatio,
      format
    };

    if (opts.generateThumbnails && opts.thumbnailSizes && opts.thumbnailSizes.length > 0) {
      result.thumbnails = await this.generateThumbnails(file, opts.thumbnailSizes, format);
    }

    return result;
  }

  private async generateThumbnails(file: File, sizes: number[], format: string): Promise<File[]> {
    const buffer = await file.arrayBuffer();
    const thumbnails: File[] = [];

    for (const size of sizes) {
      const thumbnail = await sharp(Buffer.from(buffer))
        .resize(size, size, {
          fit: 'cover',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailArrayBuffer = (thumbnail.buffer as ArrayBuffer).slice(
        thumbnail.byteOffset,
        thumbnail.byteOffset + thumbnail.byteLength
      );
      const thumbnailFile = new File(
        [thumbnailArrayBuffer],
        this.getThumbnailFileName(file.name, size, format),
        { type: `image/${format}` }
      );

      thumbnails.push(thumbnailFile);
    }

    return thumbnails;
  }

  private detectOptimalFormat(metadata: sharp.Metadata): 'webp' | 'avif' | 'jpeg' | 'png' {
    if (metadata.hasAlpha) {
      return 'webp';
    }

    if (metadata.width && metadata.width > 2000) {
      return 'avif';
    }

    return 'webp';
  }

  private getOptimizedFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_optimized.${format}`;
  }

  private getThumbnailFileName(originalName: string, size: number, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_thumb_${size}.${format}`;
  }

  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    const buffer = await file.arrayBuffer();
    const metadata = await sharp(Buffer.from(buffer)).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  async isValidImage(file: File): Promise<boolean> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      return false;
    }

    try {
      const buffer = await file.arrayBuffer();
      await sharp(Buffer.from(buffer)).metadata();
      return true;
    } catch {
      return false;
    }
  }

  async compressToTargetSize(file: File, targetSizeKB: number, format: 'webp' | 'jpeg' = 'webp'): Promise<File> {
    const targetBytes = targetSizeKB * 1024;
    let quality = 90;
    let result: File;

    while (quality >= 10) {
      const optimizationResult = await this.optimize(file, { quality, format });
      result = optimizationResult.optimized;

      if (result.size <= targetBytes) {
        return result;
      }

      quality -= 10;
    }

    const finalResult = await this.optimize(file, { quality: 10, format });
    return finalResult.optimized;
  }

  async convertFormat(file: File, targetFormat: 'webp' | 'jpeg' | 'png'): Promise<File> {
    const buffer = await file.arrayBuffer();
    let image = sharp(Buffer.from(buffer));

    switch (targetFormat) {
      case 'webp':
        image = image.webp({ quality: 85 });
        break;
      case 'jpeg':
        image = image.jpeg({ quality: 85 });
        break;
      case 'png':
        image = image.png({ quality: 85 });
        break;
    }

    const convertedBuffer = await image.toBuffer();
    const convertedArrayBuffer = (convertedBuffer.buffer as ArrayBuffer).slice(
      convertedBuffer.byteOffset,
      convertedBuffer.byteOffset + convertedBuffer.byteLength
    );
    const convertedFile = new File(
      [convertedArrayBuffer],
      this.getOptimizedFileName(file.name, targetFormat),
      { type: `image/${targetFormat}` }
    );

    return convertedFile;
  }
}
