// Cliente de API para o recurso de documentos.
// Centraliza as chamadas fetch ao backend através do prefixo /api.

const API_BASE_URL = '/api';

/**
 * Extrai uma mensagem de erro amigável de uma resposta HTTP com falha.
 */
async function extractErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data?.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Envia um documento para o backend.
 * @param {File} file
 * @param {string} [owner]
 * @returns {Promise<Object>} Metadados do documento criado
 */
export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);
  if (owner) {
    formData.append('owner', owner);
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Erro ao enviar o documento'));
  }

  return response.json();
}

/**
 * Lista os documentos cadastrados.
 * @returns {Promise<Array<Object>>}
 */
export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Erro ao listar documentos'));
  }

  return response.json();
}

/**
 * Monta a URL de download de um documento.
 * @param {string} id
 * @returns {string}
 */
export function getDocumentDownloadUrl(id) {
  return `${API_BASE_URL}/documents/${id}/download`;
}
