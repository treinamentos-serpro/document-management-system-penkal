const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/app');
const documentRepository = require('../src/repositories/document.repository');

let server;
let baseUrl;

beforeEach(() => {
  documentRepository.clear();
});

test('configuração do servidor para testes', async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  if (server) {
    server.close();
  }
  const storageDir = path.resolve(__dirname, '../storage');
  if (fs.existsSync(storageDir)) {
    const files = fs.readdirSync(storageDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(storageDir, file));
        } catch {
          // Ignora falha de limpeza
        }
      }
    }
  }
});

// Teste de fumaça do seed: garante que o app Express foi exportado.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health retorna status ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.deepStrictEqual(data, { status: 'ok' });
});

test('GET /documents retorna lista vazia inicialmente', async () => {
  const res = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.strictEqual(data.length, 0);
});

test('POST /upload rejeita requisição sem arquivo com status 400', async () => {
  const formData = new FormData();
  formData.append('owner', 'Alice');

  const res = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
});

test('POST /upload cria documento com arquivo e owner anonymous por padrão', async () => {
  const formData = new FormData();
  const fileBlob = new Blob(['conteudo do arquivo de teste'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'teste.txt');

  const res = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(res.status, 201);
  const doc = await res.json();

  assert.ok(doc.id && doc.id.startsWith('doc_'));
  assert.strictEqual(doc.originalName, 'teste.txt');
  assert.strictEqual(doc.owner, 'anonymous');
  assert.strictEqual(doc.size, 28);
  assert.ok(doc.uploadedAt);
  assert.strictEqual(doc.path, undefined, 'o caminho físico não deve ser exposto');
});

test('POST /upload cria documento com owner informado', async () => {
  const formData = new FormData();
  const fileBlob = new Blob(['outro arquivo'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'relatorio.pdf');
  formData.append('owner', 'Carlos');

  const res = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(res.status, 201);
  const doc = await res.json();

  assert.strictEqual(doc.originalName, 'relatorio.pdf');
  assert.strictEqual(doc.owner, 'Carlos');
});

test('GET /documents retorna documentos cadastrados sem expor path físico', async () => {
  const formData = new FormData();
  const fileBlob = new Blob(['conteudo documento'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'doc1.txt');
  formData.append('owner', 'Maria');

  await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  const res = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(res.status, 200);
  const list = await res.json();

  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].originalName, 'doc1.txt');
  assert.strictEqual(list[0].owner, 'Maria');
  assert.strictEqual(list[0].path, undefined);
});

test('GET /documents/:id/download retorna 404 para documento inexistente', async () => {
  const res = await fetch(`${baseUrl}/documents/doc_inexistente/download`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.error, 'Documento não encontrado');
});

test('GET /documents/:id/download baixa o arquivo com sucesso', async () => {
  const fileContent = 'conteudo binario ou texto para download';
  const formData = new FormData();
  const fileBlob = new Blob([fileContent], { type: 'text/plain' });
  formData.append('file', fileBlob, 'meu-arquivo.txt');

  const uploadRes = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  const uploadedDoc = await uploadRes.json();

  const downloadRes = await fetch(`${baseUrl}/documents/${uploadedDoc.id}/download`);
  assert.strictEqual(downloadRes.status, 200);
  const text = await downloadRes.text();
  assert.strictEqual(text, fileContent);
});

test('GET /documents/:id/download retorna 404 se o arquivo físico foi removido', async () => {
  const formData = new FormData();
  const fileBlob = new Blob(['temporario'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'temp.txt');

  const uploadRes = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  const uploadedDoc = await uploadRes.json();

  // Remove arquivo físico diretamente para simular perda de arquivo
  const storedDoc = documentRepository.findById(uploadedDoc.id);
  if (storedDoc && storedDoc.path && fs.existsSync(storedDoc.path)) {
    fs.unlinkSync(storedDoc.path);
  }

  const downloadRes = await fetch(`${baseUrl}/documents/${uploadedDoc.id}/download`);
  assert.strictEqual(downloadRes.status, 404);
  const data = await downloadRes.json();
  assert.strictEqual(data.error, 'Arquivo não encontrado no armazenamento');
});
