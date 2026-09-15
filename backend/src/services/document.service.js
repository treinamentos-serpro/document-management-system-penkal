// Serviço de documentos.
// Concentra as regras de negócio e não depende de detalhes da camada HTTP.

const crypto = require('node:crypto');
const defaultRepository = require('../repositories/document.repository');
const fileStorage = require('../repositories/file-storage');

class DocumentService {
  constructor(documentRepository = defaultRepository) {
    this.documentRepository = documentRepository;
  }

  /**
   * Converte um registro interno em formato público seguro para o cliente.
   * Remove detalhes do sistema de arquivos como 'path' e 'filename'.
   * @param {Object} doc
   * @returns {Object}
   */
  #toPublicDocument(doc) {
    return {
      id: doc.id,
      originalName: doc.originalName,
      size: doc.size,
      mimeType: doc.mimeType,
      owner: doc.owner,
      uploadedAt: doc.uploadedAt,
    };
  }

  /**
   * Processa o upload de um documento e registra seus metadados.
   * @param {Object} params
   * @param {Object} params.file Objeto de arquivo gerado pelo multer
   * @param {string} [params.owner] Nome do proprietário informado
   * @returns {Object} Metadados públicos do documento criado
   */
  createDocument({ file, owner }) {
    if (!file) {
      const error = new Error('Nenhum arquivo enviado');
      error.statusCode = 400;
      throw error;
    }

    const normalizedOwner =
      typeof owner === 'string' && owner.trim().length > 0
        ? owner.trim().slice(0, 100)
        : 'anonymous';

    const id = `doc_${crypto.randomUUID()}`;
    const uploadedAt = new Date().toISOString();

    const documentRecord = {
      id,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      owner: normalizedOwner,
      uploadedAt,
      filename: file.filename,
      path: file.path,
    };

    try {
      this.documentRepository.save(documentRecord);
      return this.#toPublicDocument(documentRecord);
    } catch (err) {
      // Em caso de falha após a gravação do arquivo, remove o arquivo físico órfão
      fileStorage.removeFile(file.path);
      throw err;
    }
  }

  /**
   * Lista todos os documentos disponíveis em formato público.
   * @returns {Array<Object>}
   */
  listDocuments() {
    const documents = this.documentRepository.findAll();
    return documents.map((doc) => this.#toPublicDocument(doc));
  }

  /**
   * Recupera os dados e o caminho físico do arquivo para download.
   * @param {string} id Identificador do documento
   * @returns {Object} Dados do arquivo para envio pelo controller
   */
  getDocumentForDownload(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      const error = new Error('Documento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (!fileStorage.exists(document.path)) {
      const error = new Error('Arquivo não encontrado no armazenamento');
      error.statusCode = 404;
      throw error;
    }

    return {
      originalName: document.originalName,
      mimeType: document.mimeType,
      path: document.path,
    };
  }
}

module.exports = new DocumentService();
module.exports.DocumentService = DocumentService;
