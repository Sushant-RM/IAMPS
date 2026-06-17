const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a buffer to Cloudinary. Falls back to local /uploads directory
 * if Cloudinary credentials are not configured.
 *
 * @param {Buffer} buffer - The file buffer from multer memoryStorage
 * @param {string} folder - The Cloudinary folder (or subfolder in local uploads)
 * @param {object} req - Express request object (used for host/protocol in local fallback)
 * @param {string} [originalName='file'] - Original filename for local fallback
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadFile(buffer, folder, req, originalName = 'file') {
    const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'demo';

    if (isCloudinaryConfigured) {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'auto', folder },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            Readable.from(buffer).pipe(uploadStream);
        });
        return result.secure_url;
    }

    // --- Local Filesystem Fallback ---
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const protocol = req ? req.protocol : 'http';
    const host = req ? req.get('host') : 'localhost:5000';
    return `${protocol}://${host}/uploads/${fileName}`;
}

module.exports = { uploadFile };
