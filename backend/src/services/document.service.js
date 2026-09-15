// Serviço de documentos.
// Concentra as regras de negócio e não depende de detalhes da camada HTTP.

const crypto = require('node:crypto');
const fs = require('node:fs');
const defaultRepository = require('../repositories/document.repository');

class DocumentService {
  constructor(documentRepository = defaultRepository) {
    this.documentRepository = documentRepository;
  }

  /**
   * Cria um erro padronizado com status HTTP.
   * @param {string} message
   * @param {number} statusCode
   * @returns {Error}
   */
  #createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Remove um arquivo do armazenamento quando necessário.
   * @param {string} filePath
   */
  #cleanupStoredFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return;
    }

    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignora falha de remoção
    }
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
   * Normaliza o nome do proprietário do documento.
   * @param {string} owner
   * @returns {string}
   */
  #normalizeOwner(owner) {
    if (typeof owner !== 'string') {
      return 'anonymous';
    }

    const normalizedOwner = owner.trim();
    return normalizedOwner.length > 0 ? normalizedOwner : 'anonymous';
  }

  /**
   * Monta o registro interno persistido no repositório.
   * @param {Object} file
   * @param {string} owner
   * @returns {Object}
   */
  #buildDocumentRecord(file, owner) {
    return {
      id: `doc_${crypto.randomUUID()}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      owner: this.#normalizeOwner(owner),
      uploadedAt: new Date().toISOString(),
      filename: file.filename,
      path: file.path,
    };
  }

  /**
   * Busca um documento e falha quando ele não existe.
   * @param {string} id
   * @returns {Object}
   */
  #getDocumentOrThrow(id) {
    const document = this.documentRepository.findById(id);

    if (!document) {
      throw this.#createError('Documento não encontrado', 404);
    }

    return document;
  }

  /**
   * Garante que o arquivo físico do documento continua disponível.
   * @param {Object} document
   */
  #ensureStoredFileExists(document) {
    if (!document.path || !fs.existsSync(document.path)) {
      throw this.#createError('Arquivo não encontrado no armazenamento', 404);
    }
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
      throw this.#createError('Nenhum arquivo enviado', 400);
    }

    const documentRecord = this.#buildDocumentRecord(file, owner);

    try {
      this.documentRepository.save(documentRecord);
      return this.#toPublicDocument(documentRecord);
    } catch (err) {
      this.#cleanupStoredFile(file.path);
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
    const document = this.#getDocumentOrThrow(id);
    this.#ensureStoredFileExists(document);

    return {
      originalName: document.originalName,
      mimeType: document.mimeType,
      path: document.path,
    };
  }
}

module.exports = new DocumentService();
module.exports.DocumentService = DocumentService;
