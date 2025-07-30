import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { VIDEO_STICKER_CONFIG } from '../constants/config';

export const processVideoToAnimatedSticker = async (
  videoPath: string,
  outputPath?: string
): Promise<Buffer> => {
  const tempDir = path.resolve('./temp');
  const timestamp = Date.now();
  const tempOutputPath =
    outputPath || path.resolve(tempDir, `sticker_${timestamp}.webp`);

  try {
    console.log('🎬 Starting video processing...');
    console.log(`📁 Input: ${path.resolve(videoPath)}`);
    console.log(`📁 Output: ${tempOutputPath}`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await validateVideoForSticker(videoPath);

    await processVideoWithFFmpeg(path.resolve(videoPath), tempOutputPath);

    const stickerBuffer = fs.readFileSync(tempOutputPath);

    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }

    console.log(`✅ Animated sticker created: ${stickerBuffer.length} bytes`);
    return stickerBuffer;
  } catch (error: any) {
    console.error('❌ Error processing video:', error);
    throw new Error(`Video processing failed: ${error?.message}`);
  }
};

const processVideoWithFFmpeg = (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .fps(VIDEO_STICKER_CONFIG.fps)
      .duration(VIDEO_STICKER_CONFIG.maxDuration)
      .outputOptions([
        '-c:v libwebp_anim',
        '-vf scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black',
        '-loop 0', // Infinite loop
        '-compression_level 4',
        '-an', // Remove audio
        '-preset default',
        '-quality 75', // Quality (0-100, lower = better quality)
      ])
      .output(outputPath)
      .format('webp')
      .on('start', (commandLine: string) => {
        console.log('🔄 FFmpeg command:', commandLine);
      })
      .on('progress', (progress: any) => {
        console.log(`📊 Progress: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log('✅ FFmpeg processing completed');
        resolve();
      })
      .on('error', (error: any) => {
        console.error('❌ FFmpeg error:', error);
        reject(error);
      })
      .run();
  });
};

const validateVideoForSticker = async (videoPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        reject(new Error(`Error analyzing video: ${error.message}`));
        return;
      }

      const videoStream = metadata.streams.find(
        stream => stream.codec_type === 'video'
      );

      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const duration = metadata.format.duration ?? 0;
      if (duration > VIDEO_STICKER_CONFIG.maxDuration) {
        reject(
          new Error(
            `Video too long. Maximum: ${VIDEO_STICKER_CONFIG.maxDuration}s`
          )
        );
        return;
      }

      const fileSize = metadata.format.size ?? 0;
      if (fileSize > VIDEO_STICKER_CONFIG.maxFileSize) {
        reject(new Error('File too large. Maximum: 50MB'));
        return;
      }

      console.log(
        ` Video valid: ${duration}s, ${Math.round(fileSize / 1024)}KB`
      );
      resolve();
    });
  });
};

export const optimizeVideoForProcessing = async (
  inputPath: string,
  outputPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(' Optimizing vídeo...');

    ffmpeg(inputPath)
      .size('720x720')
      .fps(15)
      .duration(VIDEO_STICKER_CONFIG.maxDuration)
      .videoCodec('libx264')
      .outputOptions([
        '-preset fast',
        '-crf 28',
        '-an', // Remove audio
      ])

      .output(outputPath)
      .on('end', () => {
        console.log('✅ Video optimized');
        resolve(outputPath);
      })
      .on('error', reject)
      .run();
  });
};

export const isVideoFile = (mimetype: string): boolean => {
  const videoMimetypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];

  return videoMimetypes.includes(mimetype);
};

export const estimateStickerSize = async (
  videoPath: string
): Promise<{
  estimatedSize: number;
  duration: number;
  fps: number;
}> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      const duration = Math.min(
        metadata.format.duration || 0,
        VIDEO_STICKER_CONFIG.maxDuration
      );
      const fps = VIDEO_STICKER_CONFIG.fps;
      const totalFrames = duration * fps;

      const estimatedSize = totalFrames * 2 * 1024;

      resolve({
        estimatedSize,
        duration,
        fps,
      });
    });
  });
};
