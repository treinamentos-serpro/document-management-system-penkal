// Rotas de documentos.
// Configura o middleware de upload e delega para o controller.

const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { upload } = require('../repositories/file-storage');

const router = express.Router();

// Middleware para capturar erros específicos do multer (tamanho, tipo de arquivo etc.)
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
