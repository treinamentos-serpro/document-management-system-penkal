// Controller de documentos.
// Trata entrada/saída HTTP, validação básica e formatação de respostas.
// Erros de negócio são delegados ao middleware central de tratamento de erros (ver app.js).

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
  upload(req, res, next) {
    try {
      const document = this.documentService.createDocument({
        file: req.file,
        owner: req.body?.owner,
      });

      return res.status(201).json(document);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Endpoint de listagem: GET /documents
   */
  list(req, res, next) {
    try {
      const documents = this.documentService.listDocuments();
      return res.status(200).json(documents);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Endpoint de download: GET /documents/:id/download
   */
  download(req, res, next) {
    try {
      const document = this.documentService.getDocumentForDownload(req.params.id);

      return res.download(document.path, document.originalName, (err) => {
        if (err && !res.headersSent) {
          return next(new Error('Erro ao transferir o arquivo'));
        }
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new DocumentController();
module.exports.DocumentController = DocumentController;
