// Controller de documentos.
// Trata entrada/saída HTTP, validação básica e formatação de respostas.

const fs = require('node:fs');
const defaultService = require('../services/document.service');

class DocumentController {
  constructor(documentService = defaultService) {
    this.documentService = documentService;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  /**
   * Endpoint de upload: POST /upload
   */
  upload(req, res) {
    try {
      const document = this.documentService.createDocument({
        file: req.file,
        owner: req.body?.owner,
      });

      return res.status(201).json(document);
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // Ignora falha de limpeza
        }
      }

      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao processar upload' });
    }
  }

  /**
   * Endpoint de listagem: GET /documents
   */
  list(req, res) {
    try {
      const documents = this.documentService.listDocuments();
      return res.status(200).json(documents);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao listar documentos' });
    }
  }

  /**
   * Endpoint de download: GET /documents/:id/download
   */
  download(req, res) {
    try {
      const document = this.documentService.getDocumentForDownload(req.params.id);

      return res.download(document.path, document.originalName, (err) => {
        if (err && !res.headersSent) {
          return res.status(500).json({ error: 'Erro ao transferir o arquivo' });
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ error: err.message || 'Erro ao baixar documento' });
    }
  }
}

module.exports = new DocumentController();
module.exports.DocumentController = DocumentController;
