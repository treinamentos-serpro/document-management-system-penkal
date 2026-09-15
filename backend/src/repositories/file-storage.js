// Repositório de armazenamento físico dos arquivos (persistência em disco local).
// Centraliza tudo que envolve o filesystem: diretório, allow-list de tipos,
// geração de nomes seguros e remoção de arquivos.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

const storageDir =
  process.env.STORAGE_DIRECTORY || path.resolve(__dirname, '../../storage');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Allow-list de mimetypes aceitos (evita upload irrestrito de arquivos executáveis/ativos).
const ALLOWED_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'application/zip',
]);

const maxFileSize =
  Number(process.env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024; // 10 MB padrão

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeFilename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, safeFilename);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: maxFileSize,
    fieldSize: 10 * 1024, // limita campos de texto do multipart (ex.: owner)
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido'));
    }
    cb(null, true);
  },
});

/**
 * Confirma que o caminho resolvido permanece dentro do diretório de armazenamento.
 * Defesa em profundidade contra path traversal, mesmo sem entrada de usuário no caminho hoje.
 * @param {string} filePath
 * @returns {boolean}
 */
function isInsideStorage(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(storageDir + path.sep);
}

/**
 * Verifica se o arquivo existe fisicamente e está dentro do armazenamento local.
 * @param {string} filePath
 * @returns {boolean}
 */
function exists(filePath) {
  return Boolean(filePath) && isInsideStorage(filePath) && fs.existsSync(filePath);
}

/**
 * Remove um arquivo do armazenamento, se existir, sem lançar exceção.
 * @param {string} filePath
 */
function removeFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(`Falha ao remover arquivo do armazenamento: ${filePath}`, err);
  }
}

module.exports = {
  storageDir,
  upload,
  exists,
  removeFile,
};
