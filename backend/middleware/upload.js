const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/mkv', 'video/x-matroska', 'video/avi', 'video/quicktime'];
    const allowedSubtitleTypes = ['application/x-subrip', 'text/vtt', 'text/plain', 'application/octet-stream'];

    const ext = path.extname(file.originalname).toLowerCase();
    const isSubtitleExt = ['.srt', '.vtt'].includes(ext);

    if (allowedVideoTypes.includes(file.mimetype) || allowedSubtitleTypes.includes(file.mimetype) || isSubtitleExt) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video and subtitle files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 2048 // Limit 2GB
    }
});

module.exports = upload;
