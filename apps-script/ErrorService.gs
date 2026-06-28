function publicErrorCode(error) {
  var message = normalizeText(error && error.message ? error.message : '');
  if (message.indexOf('permiss') >= 0) return 'PERMISSION_DENIED';
  if (message.indexOf('pasta') >= 0) return 'FOLDER_UNAVAILABLE';
  if (message.indexOf('periodo') >= 0) return 'INVALID_PERIOD';
  if (message.indexOf('planilha') >= 0) return 'SPREADSHEET_ERROR';
  if (message.indexOf('cabecalho') >= 0 || message.indexOf('estrutura') >= 0) return 'INVALID_STRUCTURE';
  if (message.indexOf('acao') >= 0) return 'INVALID_ACTION';
  return 'API_ERROR';
}

function publicErrorMessage(error) {
  var message = error && error.message ? error.message : 'Erro inesperado na API.';
  if (/service invoked too many times|temporarily unavailable|internal error|unexpected error/i.test(message)) {
    return 'O Google esta temporariamente indisponivel. Tente novamente em alguns minutos.';
  }
  if (/permission|permissao|access denied|authorization/i.test(message)) {
    return 'A pasta ou planilha nao possui permissao de leitura para o Apps Script.';
  }
  if (/not found|nao encontrad|inexistente/i.test(message)) return 'O recurso solicitado nao foi encontrado.';
  if (/periodo invalido|periodo duplicado|planilha vazia|aba de respostas|estrutura invalida|acao nao suportada/i.test(message)) {
    return message.slice(0, 240);
  }
  return 'Nao foi possivel concluir a consulta solicitada.';
}
