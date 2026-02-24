/**
 * lib/imageUtils.ts
 * Client-side image resize using Canvas API.
 * Resizes to fit within maxDimension and iterates quality until targetBytes is met.
 */

const MAX_DIMENSION = 2048;
const MAX_QUALITY_STEPS = 4;

export async function resizeImageToTarget(
    file: File,
    targetBytes = 1024 * 1024  // 1 MB default
): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                // Compute scaled dimensions
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Canvas context unavailable"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Iterate quality until below targetBytes
                let quality = 0.85;
                let blob: Blob | null = null;

                for (let step = 0; step < MAX_QUALITY_STEPS; step++) {
                    blob = await new Promise<Blob | null>((res) =>
                        canvas.toBlob((b) => res(b), "image/jpeg", quality)
                    );
                    if (!blob || blob.size <= targetBytes) break;
                    quality = Math.max(0.3, quality - 0.15);
                }

                if (!blob) {
                    // Fallback: return original file
                    resolve(file);
                    return;
                }

                const outputFile = new File(
                    [blob],
                    file.name.replace(/\.[^.]+$/, ".jpg"),
                    { type: "image/jpeg", lastModified: Date.now() }
                );
                resolve(outputFile);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}
