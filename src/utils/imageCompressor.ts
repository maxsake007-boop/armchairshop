/**
 * Utility to compress and optimize images client-side before uploading.
 * Converts heavy PNG/JPG files (5-10MB) into ultra-lightweight WebP format (~80-150KB).
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.82
): Promise<File> {
  // If already small SVG or gif, return as is
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image onto canvas with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to WebP Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], compressedFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            console.log(
              `⚡ Compressed ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) -> ${compressedFileName} (${(
                compressedFile.size / 1024
              ).toFixed(1)} KB)`
            );

            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => {
        console.warn('Image load error during compression:', err);
        resolve(file);
      };
    };

    reader.onerror = (err) => {
      console.warn('FileReader error during compression:', err);
      resolve(file);
    };
  });
}
