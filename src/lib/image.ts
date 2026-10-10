import { copy } from "./i18n";
export async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)
    throw new Error(copy.capture.invalid);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(copy.capture.failed);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error(copy.capture.failed)),
        "image/jpeg",
        0.8,
      ),
    );
    if (blob.size > 5 * 1024 * 1024) throw new Error(copy.capture.tooLarge);
    return blob;
  } catch (error) {
    throw error instanceof Error && error.message === copy.capture.tooLarge
      ? error
      : new Error(copy.capture.failed);
  } finally {
    URL.revokeObjectURL(url);
  }
}
