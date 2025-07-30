import sharp from 'sharp';

const STICKER_SIZE = 512;
const SQUARE_TOLERANCE = 0.1;

export const processImageToSticker = async (
  imageBuffer: Buffer
): Promise<{ square?: Buffer; original?: Buffer }> => {
  try {
    console.log('🖼️ Processing image to stickers...');

    const metadata = await sharp(imageBuffer).metadata();
    console.log(`📐 Original image: ${metadata.width}x${metadata.height}`);

    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const aspectRatio = width / height;
    const isSquare = Math.abs(aspectRatio - 1) <= SQUARE_TOLERANCE;

    if (isSquare) {
      console.log('🔲 Image is already square, creating single sticker...');
      let processor = sharp(imageBuffer);

      if (width > STICKER_SIZE || height > STICKER_SIZE) {
        processor = processor.resize(STICKER_SIZE, STICKER_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const stickerBuffer = await processor
        .webp({
          quality: 85,
          effort: 6,
        })
        .toBuffer();

      console.log(`✅ Single sticker created: ${stickerBuffer.length} bytes`);

      return {
        square: stickerBuffer,
      };
    }

    console.log('🔲 Creating square sticker (cropped)...');
    const squareStickerBuffer = await sharp(imageBuffer)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({
        quality: 85,
        effort: 6,
      })
      .toBuffer();

    console.log('📐 Creating original format sticker...');
    let originalProcessor = sharp(imageBuffer);

    if (width > STICKER_SIZE || height > STICKER_SIZE) {
      originalProcessor = originalProcessor.resize(STICKER_SIZE, STICKER_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const originalStickerBuffer = await originalProcessor
      .webp({
        quality: 85,
        effort: 6,
      })
      .toBuffer();

    console.log(
      `✅ Both image stickers created: Square ${squareStickerBuffer.length} bytes, Original ${originalStickerBuffer.length} bytes`
    );

    return {
      square: squareStickerBuffer,
      original: originalStickerBuffer,
    };
  } catch (error) {
    console.error('❌ Error processing image:', error);
    throw new Error('Image processing failed');
  }
};
