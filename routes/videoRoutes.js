const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const videoController = require('../controllers/videoController');

router.post('/upload', upload.single('video'), videoController.uploadVideo);
router.post('/process-url', videoController.processUrl);
router.get('/:id/script', videoController.getScript);
router.get('/:id/script/download', videoController.downloadScript);

// Translation Routes
router.post('/:id/translate', videoController.translateVideo);
router.get('/:id/translations', videoController.getTranslations);
router.get('/translations/:translationId/download', videoController.downloadTranslation);

module.exports = router;
