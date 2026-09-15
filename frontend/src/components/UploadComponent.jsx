import { useState } from 'react';
import { uploadDocument } from '../services/documentApi';

/**
 * Formulário para envio de um novo documento.
 * @param {Object} props
 * @param {() => void} props.onUploadSuccess Callback disparado após upload bem-sucedido
 */
export default function UploadComponent({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError('Selecione um arquivo antes de enviar');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadDocument(file, owner);
      setFile(null);
      setOwner('');
      event.target.reset();
      onUploadSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Enviar documento</h2>
      <div>
        <label htmlFor="file-input">Arquivo</label>
        <input
          id="file-input"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <div>
        <label htmlFor="owner-input">Proprietário</label>
        <input
          id="owner-input"
          type="text"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Opcional"
        />
      </div>
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
