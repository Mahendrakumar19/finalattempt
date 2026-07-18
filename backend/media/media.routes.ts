import { Router } from 'express';
import multer from 'multer';
import { mediaController } from './media.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB
  }
});

// REST Routes mapping
router.get('/', (req, res) => mediaController.getMedia(req, res));
router.get('/folders', (req, res) => mediaController.getFolders(req, res));
router.post('/folder', (req, res) => mediaController.createFolder(req, res));
router.delete('/folder/:id', (req, res) => mediaController.deleteFolder(req, res));

router.get('/:id', (req, res) => mediaController.getMediaById(req, res));
router.post('/upload', upload.single('file'), (req, res) => mediaController.uploadMedia(req, res));
router.patch('/:id', (req, res) => mediaController.updateMedia(req, res));
router.patch('/:id/rename', (req, res) => mediaController.renameMedia(req, res));
router.put('/:id/replace', upload.single('file'), (req, res) => mediaController.replaceMedia(req, res));
router.post('/move', (req, res) => mediaController.moveMedia(req, res));
router.post('/:id/restore', (req, res) => mediaController.restoreMedia(req, res));
router.delete('/:id', (req, res) => mediaController.deleteMedia(req, res));

export default router;
