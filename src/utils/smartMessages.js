export function buildSmartMessages({ filteredRows, question, questionMetrics, totalMunicipios }) {
  const messages = [];

  if (!filteredRows.length) {
    messages.push({ type: 'warning', text: 'Nenhum registro encontrado para os filtros atuais.' });
    return messages;
  }

  if (!question) {
    messages.push({ type: 'warning', text: 'Nenhuma pergunta analisavel foi selecionada.' });
    return messages;
  }

  if (!questionMetrics?.validCount) {
    messages.push({ type: 'warning', text: 'A pergunta selecionada nao possui respostas validas.' });
  }

  if (questionMetrics?.blankCount > 0) {
    messages.push({ type: 'info', text: `Existem ${questionMetrics.blankCount} respostas em branco nesta pergunta.` });
  }

  if (totalMunicipios > 0 && questionMetrics?.municipalityCount === totalMunicipios && questionMetrics.validCount > 0) {
    messages.push({ type: 'success', text: 'Todos os municipios filtrados responderam esta pergunta.' });
  }

  if (questionMetrics?.topCategory && questionMetrics.topPercent >= 60) {
    messages.push({ type: 'info', text: `A categoria dominante e "${questionMetrics.topCategory}", com ${questionMetrics.topPercent}% das respostas validas.` });
  }

  return messages;
}
