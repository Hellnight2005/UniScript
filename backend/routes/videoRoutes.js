const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const videoController = require('../controllers/videoController');

router.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'subtitle', maxCount: 1 }]), videoController.uploadVideo);
router.post('/:id/start-processing', videoController.startProcessing);

router.get('/', videoController.getLatestVideos);
router.get('/analytics', videoController.getAnalytics);
router.get('/:id/status', videoController.getVideoStatus);
router.get('/:id/script', videoController.getScript);
router.get('/:id/script/download', videoController.downloadScript);

// Translation Routes
router.post('/:id/translate', videoController.translateVideo);
router.get('/:id/translations', videoController.getTranslations);
router.get('/translations/:translationId/download', videoController.downloadTranslation);

module.exports = router;
