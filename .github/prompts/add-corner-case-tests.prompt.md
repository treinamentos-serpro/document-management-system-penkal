---
name: add-corner-case-tests
description: Use este prompt para adicionar testes de unidade para "edge cases" como campos com conteúdo maior, igual e próximos ao máximo definido, por exemplo.
argument-hint: caminho do modulo (ex. backend/src/services/document.service.js)
agent: agent
---

# Adicionar testes de edge case

Adicione testes de unidade para casos de borda (edge cases) do módulo `${input:modulo:caminho do modulo}`.

Antes de escrever os testes, identifique os limites relevantes do módulo (ex.
tamanho máximo de arquivo, tamanho máximo de campo, valores obrigatórios).

Cubra especificamente:

- Valor exatamente no limite máximo permitido (deve passar).
- Valor um a mais que o limite (deve falhar/ser rejeitado).
- Valor um a menos que o limite (deve passar).
- Valores vazios, nulos ou ausentes.

Requisitos:

- Se o módulo for do backend (`backend/src/**`), use o runner nativo
  `node:test` e `node:assert`, e coloque os testes em `backend/test`,
  seguindo o padrão já existente em `app.test.js`.
- Se o módulo for do frontend (`frontend/src/**`) e não houver runner de
  testes configurado no `frontend/package.json`, avise sobre a ausência de
  infraestrutura de testes antes de prosseguir, e sugira a configuração
  mínima necessária (ex. Vitest) em vez de assumir um runner.
- Mantenha os testes isolados, legíveis e independentes entre si.
- Não dependa de serviços externos; use o filesystem local quando necessário.
- Não altere o comportamento do código de produção, apenas adicione testes.