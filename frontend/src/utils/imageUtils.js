/**
 * Creates a new HTMLImageElement from a URL (or base64 string).
 */
export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid CORS issues on CodeSandbox
        image.src = url;
    });

/**
 * Returns the new data URL of a cropped image.
 * @param {string} imageSrc - The source image url/base64
 * @param {object} pixelCrop - { x, y, width, height }
 * @param {number} rotation - rotation in degrees (optional)
 */
export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // set each dimensions to double largest dimension to allow for a safe area for the
    // image to rotate in without being clipped by canvas context
    canvas.width = safeArea;
    canvas.height = safeArea;

    // translate canvas context to a central location on image to allow rotating around the center.
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // draw rotated image and store data.
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    // Calculate the position of the image within the canvas
    const imageX = safeArea / 2 - image.width * 0.5;
    const imageY = safeArea / 2 - image.height * 0.5;

    // Get the specific pixel data directly from the calculated coordinates
    const data = ctx.getImageData(
        Math.max(0, imageX + pixelCrop.x),
        Math.max(0, imageY + pixelCrop.y),
        pixelCrop.width,
        pixelCrop.height
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(data, 0, 0);

    // As Base64 string
    return canvas.toDataURL('image/jpeg');
};

/**
 * Compresses a base64 image string to be under a certain size (in bytes).
 * It does this by iteratively reducing the quality.
 * @param {string} base64Str - The input base64 string
 * @param {number} maxSizeKB - Max size in KB (default 500)
 * @returns {Promise<string>} - The compressed base64 string
 */
export const compressImage = async (base64Str, maxSizeKB = 500) => {
    const maxBytes = maxSizeKB * 1024;
    let quality = 1.0;
    let resultStr = base64Str;

    // Helper to get byte size of base64 string
    const getByteSize = (str) => {
        const stringLength = str.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812;
        return sizeInBytes;
    };

    if (getByteSize(resultStr) <= maxBytes) {
        return resultStr;
    }

    const img = await createImage(base64Str);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Iteratively reduce quality
    while (getByteSize(resultStr) > maxBytes && quality > 0.1) {
        quality -= 0.1;
        resultStr = canvas.toDataURL('image/jpeg', quality);
    }

    return resultStr;
};
