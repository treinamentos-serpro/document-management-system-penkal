# Especificação - Document Management System

**Status:** aprovada para implementação futura  
**Versão:** 1.0  
**Data:** 2026-09-15

## 1. Objetivo

Entregar uma aplicação web simples para que usuários enviem documentos, consultem os documentos registrados e baixem seus arquivos por identificador, utilizando armazenamento exclusivamente local e metadados mantidos em memória nesta primeira versão.

## 2. Escopo

### 2.1 Dentro do escopo

- Recebimento de documentos por upload HTTP.
- Armazenamento dos arquivos no filesystem local da aplicação.
- Registro dos metadados do documento em memória.
- Listagem dos documentos registrados durante a execução do processo.
- Download de um documento por identificador.
- Identificação textual do proprietário por meio do campo `owner`.
- Interface web React para upload, listagem e download.
- Tratamento de estados de carregamento, sucesso, lista vazia e erro no front-end.
- Testes automatizados do comportamento principal do back-end.

Nesta versão, `owner` é apenas um valor informativo enviado pelo cliente. Não existe autenticação, autorização ou isolamento de dados por usuário. Portanto, esse campo não deve ser tratado como uma fronteira de segurança.

### 2.2 Fora do escopo

- Armazenamento externo, em nuvem ou em provedores de upload.
- Banco de dados ou persistência dos metadados entre reinicializações.
- Autenticação, sessões, autorização ou controle de acesso por usuário.
- Versionamento de documentos.
- Exclusão, edição, renomeação ou substituição de documentos.
- Busca textual avançada, filtros complexos ou paginação.
- Compartilhamento por link ou colaboração.
- Digitalização, conversão, pré-visualização ou processamento do conteúdo.
- Antivirus ou análise semântica dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceitação |
| --- | --- | --- |
| RF-01 | O sistema deve permitir o envio de um documento. | Uma requisição `multipart/form-data` contendo um arquivo no campo `file` deve criar um registro e retornar HTTP `201`. |
| RF-02 | O sistema deve aceitar um proprietário textual opcional. | Quando `owner` for informado, seu valor deve ser associado ao registro. Quando não for informado ou estiver vazio, deve ser usado `anonymous`. |
| RF-03 | O sistema deve gerar um identificador único para cada documento. | O registro criado deve possuir um `id` estável durante a execução, preferencialmente no formato `doc_<UUID>`. |
| RF-04 | O sistema deve preservar o nome original do arquivo nos metadados. | `originalName` deve refletir o nome recebido no upload, sem ser usado diretamente como caminho físico de armazenamento. |
| RF-05 | O sistema deve armazenar o arquivo localmente. | O arquivo deve ser gravado em diretório local configurado, por meio do `multer` com `diskStorage`, sem chamadas a serviços externos. |
| RF-06 | O sistema deve registrar os metadados do documento em memória. | Após um upload bem-sucedido, o documento deve estar disponível para listagem e download até o processo ser reiniciado. |
| RF-07 | O sistema deve listar os documentos registrados. | `GET /documents` deve retornar HTTP `200` e um array JSON; quando não houver documentos, o array deve ser vazio. |
| RF-08 | A listagem deve retornar apenas dados necessários ao cliente. | O caminho absoluto ou relativo do arquivo (`path`) não deve aparecer nas respostas públicas. |
| RF-09 | O sistema deve permitir o download por identificador. | Para um `id` válido e um arquivo existente, a resposta deve ser HTTP `200`, conter o binário e usar `Content-Disposition: attachment`. |
| RF-10 | O sistema deve informar documento inexistente. | Um download com identificador não registrado deve retornar HTTP `404` e um corpo JSON no formato `{ "error": "..." }`. |
| RF-11 | O sistema deve detectar arquivo ausente no armazenamento. | Se o registro existir, mas o arquivo não existir no filesystem, o download deve retornar HTTP `404` com mensagem específica. |
| RF-12 | O sistema deve rejeitar upload sem arquivo. | Uma requisição sem o campo `file` deve retornar HTTP `400` e não criar registro de documento. |
| RF-13 | O sistema deve tratar erros de upload do `multer`. | Limite excedido, campo inválido ou falha de armazenamento devem produzir resposta de erro controlada, sem stack trace para o cliente. |
| RF-14 | O sistema deve expor um healthcheck. | `GET /health` deve retornar HTTP `200` com `{ "status": "ok" }` quando o processo estiver disponível. |
| RF-15 | O front-end deve consumir a API por `fetch`. | Upload, listagem e download devem ser realizados por um serviço de comunicação, sem acesso direto do navegador ao filesystem. |
| RF-16 | O front-end deve atualizar a listagem após upload. | Após um upload bem-sucedido, o documento deve aparecer na lista sem exigir recarga manual da página. |
| RF-17 | O front-end deve apresentar estados operacionais. | A interface deve representar carregamento, erro, lista vazia, sucesso e indisponibilidade do back-end de forma compreensível. |

### 3.1 Regras de negócio

1. O campo `file` é obrigatório e aceita um único arquivo por requisição.
2. O campo `owner` é opcional e deve ser normalizado para `anonymous` quando ausente ou vazio.
3. O nome original não pode definir sozinho o nome físico do arquivo.
4. O nome físico deve ser gerado pelo sistema, ser seguro para o filesystem e não permitir path traversal.
5. O identificador do documento não deve depender do nome enviado pelo usuário.
6. O tamanho registrado deve ser informado em bytes.
7. A data `uploadedAt` deve ser produzida pelo servidor no momento do registro, em ISO 8601.
8. A listagem deve retornar os documentos em ordem determinística. A implementação inicial deve usar a ordem de criação, salvo decisão posterior documentada.
9. A ausência de metadados após reinicialização é uma limitação conhecida da primeira versão. Arquivos que permanecerem no diretório local não serão automaticamente reindexados.
10. Falhas ocorridas depois da gravação do arquivo devem ser tratadas para evitar, quando possível, arquivos órfãos sem registro correspondente.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O back-end deve usar Node.js, Express e JavaScript CommonJS. |
| RNF-02 | O front-end deve usar React, Vite e JavaScript ESM. |
| RNF-03 | O armazenamento de arquivos deve ser exclusivamente o filesystem local da aplicação. |
| RNF-04 | O upload deve usar `multer` configurado com `diskStorage`. |
| RNF-05 | Os metadados devem permanecer em memória, sem banco de dados nesta fase. |
| RNF-06 | A configuração operacional deve ser obtida por variáveis de ambiente, seguindo o princípio 12-Factor. |
| RNF-07 | As camadas internas não devem depender diretamente de detalhes de HTTP. |
| RNF-08 | O caminho físico do arquivo deve ser um detalhe interno e nunca deve ser exposto pela API pública. |
| RNF-09 | Os nomes físicos devem ser gerados pelo sistema, evitando colisões e path traversal. |
| RNF-10 | Limite de tamanho, diretório de storage e política de tipos de arquivo devem ser configuráveis. |
| RNF-11 | Erros de entrada e infraestrutura devem ser tratados nos limites do sistema e retornar mensagens controladas. |
| RNF-12 | O comportamento principal deve ser coberto por testes automatizados usando o runner nativo `node:test`. |
| RNF-13 | O front-end deve permanecer responsivo e acessível em fluxos de upload, listagem e download. |

### 4.1 Configuração mínima prevista

Os nomes abaixo representam a configuração esperada. Valores padrão devem ser definidos na implementação e documentados junto ao código:

| Variável | Finalidade |
| --- | --- |
| `PORT` | Porta HTTP do back-end; padrão esperada: `3000`. |
| `STORAGE_DIRECTORY` | Diretório local para os arquivos; padrão esperado: `backend/storage`. |
| `MAX_FILE_SIZE_BYTES` | Tamanho máximo permitido por arquivo. |
| `ALLOWED_MIME_TYPES` | Lista configurável de tipos MIME aceitos. Uma política permissiva pode ser usada inicialmente, desde que o limite de tamanho seja aplicado. |
| `NODE_ENV` | Ambiente de execução e nível de comportamento operacional. |

A configuração não deve conter credenciais de provedores externos, pois nenhum provedor externo faz parte desta especificação.

## 5. Modelo de dados

### 5.1 Metadado público do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | sim | Identificador único, gerado pelo servidor. Formato esperado: `doc_<UUID>`. |
| `originalName` | string | sim | Nome original informado pelo cliente. |
| `fileName` | string | sim | Nome seguro gerado para o armazenamento local. Pode ser retornado como metadado técnico, mas não deve ser usado pelo cliente para montar caminhos. |
| `size` | number | sim | Tamanho do arquivo em bytes. Deve ser um número inteiro não negativo. |
| `uploadedAt` | string | sim | Data e hora do upload em formato ISO 8601. |
| `owner` | string | sim | Identificador textual do proprietário; usa `anonymous` quando não informado. |
| `mimeType` | string | sim | Tipo MIME informado ou detectado pelo upload; fallback esperado: `application/octet-stream`. |

### 5.2 Campo interno

| Campo | Tipo | Escopo | Descrição |
| --- | --- | --- | --- |
| `path` | string | interno | Caminho físico absoluto ou resolvido do arquivo no storage. Não deve ser retornado pela API. |

O repositório pode manter outros detalhes internos, desde que eles não atravessem a fronteira pública sem necessidade.

### 5.3 Regras de persistência

- O repositório deve manter os registros em uma estrutura em memória, preferencialmente `Map`, indexada por `id`.
- A criação do registro deve ocorrer somente depois que o arquivo estiver disponível no destino final.
- A leitura do conteúdo deve ser feita somente após localizar o registro e confirmar a existência do arquivo.
- A reinicialização do processo limpa os metadados em memória.
- O diretório de storage deve ser criado sob demanda ou durante a inicialização, conforme a decisão de implementação.
- O arquivo temporário gerado pelo `multer` deve ser removido ou movido de forma controlada após a conclusão do fluxo.

## 6. Contratos de API

### 6.1 Convenção de rotas

O back-end Express define as rotas sem prefixo:

- `POST /upload`
- `GET /documents`
- `GET /documents/:id/download`
- `GET /health`

Durante o desenvolvimento, o front-end chama as mesmas operações usando o prefixo `/api`:

- `POST /api/upload`
- `GET /api/documents`
- `GET /api/documents/:id/download`

O proxy do Vite deve remover `/api` e encaminhar as requisições para o back-end. O prefixo é uma convenção de integração do front-end, não uma segunda implementação da API.

Todas as respostas de erro JSON devem seguir o formato:

```json
{
  "error": "Mensagem descritiva para o cliente."
}
```

Mensagens podem ser apresentadas ao usuário, mas detalhes internos como stack trace, caminho físico, nomes de diretórios ou informações de infraestrutura não devem ser enviados.

### 6.2 POST /upload

**Objetivo:** receber e registrar um documento.

**Requisição pública:** `POST /api/upload` no front-end ou `POST /upload` diretamente no back-end.

**Content-Type:** `multipart/form-data`.

**Partes aceitas:**

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `file` | arquivo | sim | Arquivo único a ser armazenado. |
| `owner` | string | não | Identificador textual do proprietário. Fallback: `anonymous`. |

O cliente não deve enviar `Content-Type` manualmente quando usar `FormData`; o navegador deve gerar o boundary da requisição.

**Sucesso:** HTTP `201 Created`.

**Resposta de sucesso:** objeto JSON com os metadados públicos do documento criado.

Exemplo:

```json
{
  "id": "doc_8d2b2d7c-1f4f-4b40-9b5d-2ac2e8c77f4a",
  "originalName": "relatorio.txt",
  "fileName": "file-1730000000000.txt",
  "size": 18,
  "uploadedAt": "2026-09-15T12:00:00.000Z",
  "owner": "user-001",
  "mimeType": "text/plain"
}
```

O campo interno `path` não deve aparecer na resposta.

**Erros previstos:**

| Status | Situação |
| --- | --- |
| `400` | Campo `file` ausente, campo inválido ou entrada básica inválida. |
| `413` | Arquivo acima de `MAX_FILE_SIZE_BYTES`, quando o limite estiver configurado. |
| `415` | Tipo MIME não permitido pela política configurada. |
| `500` | Falha inesperada de filesystem, geração do registro ou infraestrutura. |

### 6.3 GET /documents

**Objetivo:** listar os documentos registrados em memória.

**Requisição pública:** `GET /api/documents` no front-end ou `GET /documents` diretamente no back-end.

**Sucesso:** HTTP `200 OK`.

**Resposta:** array JSON de metadados públicos.

Exemplo:

```json
[
  {
    "id": "doc_8d2b2d7c-1f4f-4b40-9b5d-2ac2e8c77f4a",
    "originalName": "relatorio.txt",
    "fileName": "file-1730000000000.txt",
    "size": 18,
    "uploadedAt": "2026-09-15T12:00:00.000Z",
    "owner": "user-001",
    "mimeType": "text/plain"
  }
]
```

Quando não houver registros, a resposta deve ser `[]`, e não `null` ou um objeto com uma propriedade adicional.

**Erros previstos:**

| Status | Situação |
| --- | --- |
| `500` | Falha inesperada ao consultar o repositório em memória. |

A versão inicial não oferece parâmetros de paginação, filtro ou autenticação.

### 6.4 GET /documents/:id/download

**Objetivo:** retornar o conteúdo binário de um documento.

**Requisição pública:** `GET /api/documents/:id/download` no front-end ou `GET /documents/:id/download` diretamente no back-end.

**Parâmetro de rota:**

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador do documento, normalmente no formato `doc_<UUID>`. |

**Sucesso:** HTTP `200 OK`.

**Headers de resposta:**

- `Content-Type`: `mimeType` registrado; fallback `application/octet-stream`.
- `Content-Disposition`: `attachment`, com o nome original sanitizado para uso no header.
- `Content-Length`: pode ser informado quando conhecido.

O corpo da resposta deve ser o conteúdo binário do arquivo. O cliente web deve iniciar o download sem tentar interpretar o conteúdo como JSON.

**Erros previstos:**

| Status | Situação |
| --- | --- |
| `404` | O `id` não corresponde a nenhum metadado registrado. |
| `404` | O registro existe, mas o arquivo não está mais presente no storage local. |
| `400` | Identificador ausente ou em formato inválido, caso a implementação opte por validar o formato antes da consulta. |
| `500` | Falha inesperada ao ler o arquivo. |

Para respostas de erro, o corpo deve ser JSON no formato padrão de erro. O conteúdo do arquivo não deve ser retornado quando a leitura falhar.

### 6.5 GET /health

**Objetivo:** permitir verificar se o processo HTTP está respondendo.

**Requisição:** `GET /health`.

**Sucesso:** HTTP `200 OK`.

**Resposta:**

```json
{
  "status": "ok"
}
```

Esse endpoint não verifica a existência de documentos nem garante que todo upload terá sucesso; ele representa apenas a disponibilidade básica do processo.

### 6.6 Compatibilidade entre front-end e back-end

| Operação | URL usada pelo front-end | Rota Express de destino |
| --- | --- | --- |
| Upload | `/api/upload` | `/upload` |
| Listagem | `/api/documents` | `/documents` |
| Download | `/api/documents/:id/download` | `/documents/:id/download` |
| Healthcheck | `/health` ou endpoint configurado | `/health` |

O código do front-end deve centralizar essas URLs em um serviço de API, evitando duplicação de strings entre componentes.

## 7. Decisões arquiteturais

### 7.1 Back-end

O back-end deve seguir uma Clean Architecture simples, com dependências apontando das camadas externas para as internas:

```text
routes -> controllers -> services -> repositories
```

#### `routes/`

- Declara as rotas HTTP.
- Configura o middleware `multer` com `diskStorage`.
- Define o campo de upload `file` e encaminha a requisição ao controller.
- Não implementa regras de negócio.

#### `controllers/`

- Lê parâmetros, campos e arquivos da requisição.
- Executa validações básicas de entrada.
- Invoca os serviços.
- Traduz o resultado para status, headers e corpo HTTP.
- Converte erros conhecidos para respostas controladas.

#### `services/`

- Concentra as regras de negócio do upload, listagem e download.
- Define o comportamento para arquivo obrigatório, documento inexistente e arquivo ausente.
- Coordena a movimentação/cópia e a limpeza de arquivos no filesystem.
- Não deve conhecer detalhes de `req` ou `res` do Express.

#### `repositories/`

- Mantém os metadados em memória.
- Cria, lista e busca documentos por identificador.
- Encapsula a estrutura `Map` e evita que controllers manipulem diretamente o armazenamento de metadados.

#### `app.js`

- Cria e configura a aplicação Express.
- Registra parsers e rotas.
- Expõe o healthcheck.
- Exporta o app para testes.
- Inicia o servidor somente quando executado como processo principal.

### 7.2 Armazenamento local

- O diretório padrão é `backend/storage`.
- O `multer` deve usar `diskStorage`.
- O nome recebido do cliente não pode ser concatenado diretamente ao diretório.
- O serviço deve trabalhar com nomes físicos gerados pelo sistema.
- Nenhum SDK ou serviço externo de armazenamento deve ser adicionado.
- O filesystem é a fonte do conteúdo binário; o repositório em memória é a fonte dos metadados durante a execução.

### 7.3 Front-end

- A aplicação deve usar componentes funcionais e React Hooks.
- A comunicação com o back-end deve ficar em `src/services/` e usar `fetch`.
- A organização deve separar componentes reutilizáveis e páginas.
- O componente de upload deve enviar `FormData`.
- A listagem deve renderizar nome, tamanho, data, proprietário e ação de download.
- O download deve tratar a resposta como `Blob` e usar o nome recebido no header ou nos metadados.
- Componentes não devem conhecer caminhos locais do back-end.

### 7.4 Tratamento de erros

Erros devem ser tratados nos limites do sistema:

- `multer` e entrada HTTP no limite de rotas/controllers.
- Regras de negócio no service.
- Falhas de filesystem no service/repository, com tradução pelo controller.
- Mensagens para o cliente em português e sem detalhes sensíveis.
- Stack traces apenas em logging apropriado do servidor, se o logging for implementado.

## 8. Plano de execução

As etapas abaixo são um plano futuro. A criação desta especificação não executa nenhuma delas.

### Etapa 1 - Consolidar contrato e configuração

- Revisar esta especificação com o time.
- Confirmar valores padrão para `PORT`, diretório, limite e tipos MIME.
- Definir o formato final das mensagens de erro.
- Confirmar o mapeamento do proxy `/api`.

**Saída:** contrato aprovado e lista de configurações documentada.

### Etapa 2 - Implementar a base do back-end

- Configurar o Express e o healthcheck.
- Registrar o parser JSON.
- Adicionar as rotas de documentos.
- Configurar `multer.diskStorage` no diretório local.
- Centralizar as configurações ambientais.

**Critério de aceite:** o processo inicia, responde ao healthcheck e recebe a rota de upload sem usar storage externo.

### Etapa 3 - Implementar repository e modelo de metadados

- Criar o repositório em memória usando `Map`.
- Implementar criação, listagem e busca por `id`.
- Gerar IDs únicos e timestamps ISO 8601.
- Separar campos públicos de detalhes internos, especialmente `path`.

**Critério de aceite:** registros podem ser criados, listados e localizados durante a execução do processo.

### Etapa 4 - Implementar services e controllers

- Implementar o fluxo de upload.
- Validar arquivo obrigatório, owner, nome físico e política de tamanho/tipo.
- Garantir criação/limpeza do arquivo local.
- Implementar listagem.
- Implementar leitura binária e headers de download.
- Padronizar respostas de erro.

**Critério de aceite:** os três fluxos principais funcionam pelos contratos HTTP definidos e não expõem caminhos físicos.

### Etapa 5 - Implementar testes do back-end

Adicionar testes para:

- Exportação e inicialização do app.
- Healthcheck.
- Lista vazia.
- Upload com e sem `owner`.
- Upload sem arquivo.
- Upload acima do limite.
- Tipo MIME não permitido, quando a política estiver ativa.
- Identificador único.
- Listagem dos metadados.
- Download com conteúdo e headers esperados.
- Download de documento inexistente.
- Download de arquivo removido do storage.
- Limpeza de temporários e comportamento diante de falhas.

**Verificação futura:** executar `npm test` no diretório `backend`.

### Etapa 6 - Implementar o serviço de API do front-end

- Criar funções para upload, listagem e download.
- Usar o prefixo `/api` conforme o proxy do Vite.
- Interpretar erros JSON da API.
- Retornar `Blob` para download.
- Evitar duplicar URLs nos componentes.

**Critério de aceite:** o front-end consegue realizar as três operações sem acesso direto ao filesystem.

### Etapa 7 - Implementar componentes e página principal

- Criar formulário de upload.
- Criar listagem de documentos.
- Criar ação de download.
- Exibir owner, nome, tamanho e data.
- Implementar estados de carregamento, vazio, sucesso e erro.
- Atualizar a lista após upload.
- Garantir labels, foco de teclado e mensagens acessíveis.

**Critério de aceite:** um usuário consegue enviar, visualizar e baixar um documento pela interface web.

### Etapa 8 - Integrar e validar

- Iniciar back-end e front-end em conjunto.
- Verificar o proxy `/api`.
- Validar upload de arquivos reais e download do conteúdo original.
- Verificar comportamento após reinicialização e registrar a limitação dos metadados em memória.
- Executar `npm test` no back-end.
- Executar `npm run build` no front-end.
- Revisar se nenhum caminho local ou detalhe interno aparece na interface/API.

**Critério de aceite final:** os requisitos funcionais RF-01 a RF-17 e os requisitos não funcionais aplicáveis estão atendidos, com testes e build concluídos.

## 9. Critérios de aceite do produto

- É possível enviar um arquivo pela API e pela interface web.
- O arquivo é gravado somente no storage local configurado.
- O upload retorna os metadados do documento sem expor `path`.
- A listagem retorna um array e mostra a lista vazia corretamente.
- O download devolve o conteúdo original com `Content-Type` e `Content-Disposition` adequados.
- Ausência de arquivo, documento inexistente e arquivo removido produzem erros controlados.
- O campo `owner` é opcional e usa `anonymous` quando necessário.
- Os metadados são mantidos em memória e essa limitação está documentada.
- O código respeita a separação `routes -> controllers -> services -> repositories`.
- Nenhuma dependência de armazenamento externo é adicionada.
- Os testes do back-end e o build do front-end passam após a implementação futura.

## 10. Evoluções futuras

As seguintes evoluções podem ser consideradas em uma versão posterior, sem fazer parte desta entrega:

- Autenticação e autorização por usuário.
- Persistência dos metadados em banco de dados.
- Reindexação dos arquivos locais após reinício.
- Exclusão e gerenciamento do ciclo de vida dos documentos.
- Paginação, filtros e busca.
- Versionamento.
- Armazenamento externo, caso uma nova decisão arquitetural autorize esse recurso.
