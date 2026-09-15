// Rotas de documentos.
// Configura o middleware de upload (multer com diskStorage) e delega para o controller.

const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const documentController = require('../controllers/document.controller');

const router = express.Router();

// Define o diretório local de armazenamento (padrão: backend/storage)
const storageDir =
  process.env.STORAGE_DIRECTORY ||
  path.resolve(__dirname, '../../storage');

// Garante que o diretório de armazenamento existe
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configuração do multer com diskStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeFilename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, safeFilename);
  },
});

const maxFileSize =
  Number(process.env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024; // 10 MB padrão

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
});

// Middleware para capturar erros específicos do multer
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Erro ao processar o arquivo' });
    }
    next();
  });
};

// Endpoints do recurso de documentos
router.post('/upload', uploadMiddleware, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
