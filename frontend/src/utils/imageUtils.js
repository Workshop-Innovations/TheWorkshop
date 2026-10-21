import { API_BASE_URL } from "../services/api.js";
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5,
  );

  const imageX = safeArea / 2 - image.width * 0.5;
  const imageY = safeArea / 2 - image.height * 0.5;

  const data = ctx.getImageData(
    Math.max(0, imageX + pixelCrop.x),
    Math.max(0, imageY + pixelCrop.y),
    pixelCrop.width,
    pixelCrop.height,
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL("image/jpeg");
};

export const compressImage = async (base64Str, maxSizeKB = 500) => {
  const maxBytes = maxSizeKB * 1024;
  let quality = 1.0;
  let resultStr = base64Str;

  const getByteSize = (str) => {
    const stringLength = str.length - "data:image/jpeg;base64,".length;
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
    return sizeInBytes;
  };

  if (getByteSize(resultStr) <= maxBytes) {
    return resultStr;
  }

  const img = await createImage(base64Str);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  while (getByteSize(resultStr) > maxBytes && quality > 0.1) {
    quality -= 0.1;
    resultStr = canvas.toDataURL("image/jpeg", quality);
  }

  return resultStr;
};

export const resolveImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith("/")) {
    return `${API_BASE_URL}${src}`;
  }
  return src;
};
