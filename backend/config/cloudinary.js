/**
 * Cloudinary Configuration
 * 
 * Set these environment variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<string>} - Cloudinary URL
 */
const uploadImage = (buffer, mimeType) => {
    return new Promise((resolve, reject) => {
        const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
        
        cloudinary.uploader.upload(base64Image, {
            folder: 'guess-game',
            resource_type: 'image'
        }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.secure_url);
            }
        });
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} url - Cloudinary URL
 */
const deleteImage = async (url) => {
    try {
        // Extract public_id from URL
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = `guess-game/${filename.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};

module.exports = { uploadImage, deleteImage };
