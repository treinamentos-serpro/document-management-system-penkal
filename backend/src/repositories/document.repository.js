// Repositório de documentos em memória.
// Responsável exclusivamente pela persistência e recuperação dos metadados.

class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  /**
   * Salva um registro de documento em memória.
   * @param {Object} document
   * @returns {Object}
   */
  save(document) {
    this.documents.set(document.id, { ...document });
    return { ...document };
  }

  /**
   * Retorna todos os documentos registrados em ordem de criação.
   * @returns {Array<Object>}
   */
  findAll() {
    return Array.from(this.documents.values()).map((doc) => ({ ...doc }));
  }

  /**
   * Busca um documento pelo identificador único.
   * @param {string} id
   * @returns {Object|null}
   */
  findById(id) {
    const doc = this.documents.get(id);
    return doc ? { ...doc } : null;
  }

  /**
   * Limpa todos os registros (útil para testes).
   */
  clear() {
    this.documents.clear();
  }
}

module.exports = new DocumentRepository();
module.exports.DocumentRepository = DocumentRepository;
