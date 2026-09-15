import { getDocumentDownloadUrl } from '../services/documentApi';

/**
 * Botão de link para download de um documento específico.
 * @param {Object} props
 * @param {string} props.documentId
 * @param {string} props.fileName
 */
export default function DownloadButton({ documentId, fileName }) {
  return (
    <a href={getDocumentDownloadUrl(documentId)} download={fileName}>
      <button type="button">Baixar</button>
    </a>
  );
}
