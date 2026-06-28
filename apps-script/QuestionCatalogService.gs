var QUESTION_HEADERS = [
  'questionId', 'canonicalText', 'normalizedText', 'conceptKey', 'category', 'axis', 'indicatorId',
  'indicatorLinkStatus', 'type',
  'firstPeriod', 'lastPeriod', 'status', 'reviewStatus', 'createdAt', 'updatedAt'
];
var OCCURRENCE_HEADERS = [
  'occurrenceId', 'questionId', 'periodKey', 'year', 'month', 'code', 'originalText',
  'normalizedText', 'axis', 'indicatorId', 'indicatorLinkStatus', 'type', 'order', 'matchMethod',
  'similarity', 'fileUpdatedAt', 'processedAt'
];
var INDICATOR_HEADERS = [
  'indicatorId', 'name', 'normalizedName', 'conceptKey', 'category', 'axis', 'description',
  'status', 'reviewStatus', 'firstPeriod', 'lastPeriod', 'createdAt', 'updatedAt'
];
var PROCESSED_HEADERS = ['periodKey', 'fileUpdatedAt', 'processedAt', 'questionCount'];
var CHANGE_HEADERS = ['changeId', 'timestamp', 'periodKey', 'eventType', 'questionId', 'details'];

var QUESTION_STOPWORDS = {
  a: true, o: true, as: true, os: true, um: true, uma: true, de: true, da: true, do: true,
  das: true, dos: true, e: true, em: true, no: true, na: true, nos: true, nas: true, com: true,
  para: true, por: true, que: true, qual: true, quais: true, foi: true, foram: true, escola: true,
  possui: true, existe: true, esta: true, disponivel: true, disponibilidade: true, acesso: true,
  conexao: true, houve: true, realizou: true, realizada: true, realizado: true
};

function findExistingCatalogSpreadsheet() {
  var folder = getOfficialFolder();
  var files = folder.getFilesByName(AP_CONFIG.QUESTION_CATALOG_FILE_NAME);
  while (files.hasNext()) {
    var file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) return SpreadsheetApp.openById(file.getId());
  }
  return null;
}

function getOrCreateCatalogSpreadsheet() {
  var folder = getOfficialFolder();
  var existing = findExistingCatalogSpreadsheet();
  if (existing) return existing;
  var spreadsheet = SpreadsheetApp.create(AP_CONFIG.QUESTION_CATALOG_FILE_NAME);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);
  spreadsheet.getSheets()[0].setName('Perguntas');
  return spreadsheet;
}

function questionCatalogVersion() {
  var spreadsheet = findExistingCatalogSpreadsheet();
  if (!spreadsheet) return 'sem-indicadores';
  return String(DriveApp.getFileById(spreadsheet.getId()).getLastUpdated().getTime());
}

function ensureCatalogSheet(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function readSheetRecords(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(String);
  return values.slice(1).filter(function(row) {
    return row.some(function(cell) { return cell !== '' && cell !== null; });
  }).map(function(row) {
    return headers.reduce(function(record, header, index) {
      record[header] = normalizeCell(row[index]);
      return record;
    }, {});
  });
}

function replaceSheetRecords(sheet, headers, records) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!records.length) return;
  var rows = records.map(function(record) {
    return headers.map(function(header) { return record[header] === undefined ? '' : record[header]; });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function openQuestionCatalogStore() {
  var spreadsheet = getOrCreateCatalogSpreadsheet();
  return {
    spreadsheet: spreadsheet,
    questionsSheet: ensureCatalogSheet(spreadsheet, 'Perguntas', QUESTION_HEADERS),
    indicatorsSheet: ensureCatalogSheet(spreadsheet, 'Indicadores', INDICATOR_HEADERS),
    occurrencesSheet: ensureCatalogSheet(spreadsheet, 'Ocorrencias', OCCURRENCE_HEADERS),
    processedSheet: ensureCatalogSheet(spreadsheet, 'PeriodosProcessados', PROCESSED_HEADERS),
    changesSheet: ensureCatalogSheet(spreadsheet, 'HistoricoAlteracoes', CHANGE_HEADERS)
  };
}

function normalizeQuestionText(text) {
  return normalizeText(text)
    .replace(/^\d+\.\d+\s*-?\s*/, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function questionConceptTokens(text) {
  var tokens = normalizeQuestionText(text).split(' ').filter(function(token) {
    return token.length > 2 && !QUESTION_STOPWORDS[token];
  });
  var unique = {};
  tokens.forEach(function(token) { unique[token] = true; });
  return Object.keys(unique).sort();
}

function questionConceptKey(text) {
  return questionConceptTokens(text).join(' ');
}

function levenshteinDistance(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  var previous = [];
  for (var column = 0; column <= b.length; column += 1) previous[column] = column;
  for (var row = 1; row <= a.length; row += 1) {
    var current = [row];
    for (var col = 1; col <= b.length; col += 1) {
      var cost = a.charAt(row - 1) === b.charAt(col - 1) ? 0 : 1;
      current[col] = Math.min(current[col - 1] + 1, previous[col] + 1, previous[col - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

function textSimilarity(a, b) {
  var left = normalizeQuestionText(a);
  var right = normalizeQuestionText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  var maxLength = Math.max(left.length, right.length);
  var editScore = maxLength ? 1 - levenshteinDistance(left, right) / maxLength : 0;
  var leftTokens = questionConceptTokens(left);
  var rightTokens = questionConceptTokens(right);
  var union = {};
  var intersection = 0;
  leftTokens.forEach(function(token) { union[token] = true; });
  rightTokens.forEach(function(token) {
    if (union[token]) intersection += 1;
    union[token] = true;
  });
  var tokenScore = Object.keys(union).length ? intersection / Object.keys(union).length : 0;
  var leftConcept = leftTokens.join(' ');
  var rightConcept = rightTokens.join(' ');
  var conceptScore = leftConcept && leftConcept === rightConcept ? 1 : tokenScore;
  return Math.max(editScore * 0.55 + tokenScore * 0.45, conceptScore * 0.88);
}

function classifyQuestion(text) {
  var normalized = normalizeQuestionText(text);
  var rules = [
    { category: 'Infraestrutura e conectividade', terms: ['internet', 'wifi', 'computador', 'equipamento', 'infraestrutura'] },
    { category: 'Planejamento pedagogico', terms: ['planejamento', 'curriculo', 'pedagogico', 'plano de aula'] },
    { category: 'Aprendizagem e avaliacao', terms: ['aprendizagem', 'avaliacao', 'desempenho', 'recomposicao'] },
    { category: 'Frequencia e permanencia', terms: ['frequencia', 'abandono', 'evasao', 'busca ativa'] },
    { category: 'Formacao', terms: ['formacao', 'capacitacao', 'curso'] },
    { category: 'Gestao escolar', terms: ['gestao', 'direcao', 'coordenacao', 'reuniao'] }
  ];
  for (var index = 0; index < rules.length; index += 1) {
    if (rules[index].terms.some(function(term) { return normalized.indexOf(term) >= 0; })) {
      return rules[index].category;
    }
  }
  return 'Nao classificada';
}

function inferIndicatorDefinition(text) {
  var normalized = normalizeQuestionText(text);
  var rules = [
    {
      terms: ['internet', 'wifi', 'conexao', 'conectividade'],
      category: 'Infraestrutura', axis: 'Conectividade', name: 'Disponibilidade de Internet'
    },
    {
      terms: ['computador', 'equipamento', 'tablet', 'projetor'],
      category: 'Infraestrutura', axis: 'Recursos tecnologicos', name: 'Disponibilidade de Equipamentos'
    },
    {
      terms: ['planejamento', 'plano de aula'],
      category: 'Gestao pedagogica', axis: 'Planejamento', name: 'Realizacao do Planejamento Pedagogico'
    },
    {
      terms: ['frequencia', 'evasao', 'abandono', 'busca ativa'],
      category: 'Permanencia', axis: 'Frequencia escolar', name: 'Participacao e Permanencia'
    },
    {
      terms: ['avaliacao', 'aprendizagem', 'desempenho', 'recomposicao'],
      category: 'Ensino e aprendizagem', axis: 'Aprendizagem', name: 'Acompanhamento da Aprendizagem'
    },
    {
      terms: ['formacao', 'capacitacao', 'curso'],
      category: 'Desenvolvimento profissional', axis: 'Formacao', name: 'Participacao em Formacao'
    },
    {
      terms: ['reuniao', 'encontro pedagogico'],
      category: 'Gestao pedagogica', axis: 'Articulacao pedagogica', name: 'Realizacao de Reunioes Pedagogicas'
    }
  ];
  for (var index = 0; index < rules.length; index += 1) {
    if (rules[index].terms.some(function(term) { return normalized.indexOf(term) >= 0; })) return rules[index];
  }
  return null;
}

function nextIndicatorId(indicators) {
  var maximum = indicators.reduce(function(max, indicator) {
    var match = String(indicator.indicatorId || '').match(/^IND-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return 'IND-' + String(maximum + 1).padStart(4, '0');
}

function resolveIndicatorDefinition(definition, indicators) {
  var normalizedName = normalizeQuestionText(definition.name);
  var exact = indicators.find(function(indicator) {
    return indicator.normalizedName === normalizedName;
  });
  if (exact) return { indicator: exact, method: 'nome-exato', similarity: 1 };

  var candidates = indicators.filter(function(indicator) {
    return indicator.category === definition.category && indicator.axis === definition.axis;
  }).map(function(indicator) {
    return { indicator: indicator, similarity: textSimilarity(definition.name, indicator.name) };
  }).sort(function(a, b) { return b.similarity - a.similarity; });

  if (candidates.length > 1 && candidates[0].similarity >= AP_CONFIG.QUESTION_MATCH_THRESHOLD
      && candidates[0].similarity - candidates[1].similarity < 0.05) {
    return { conflict: candidates.slice(0, 2), method: 'conflito-indicador' };
  }
  if (candidates.length && candidates[0].similarity >= AP_CONFIG.QUESTION_MATCH_THRESHOLD) {
    return { indicator: candidates[0].indicator, method: 'heuristica-indicador', similarity: candidates[0].similarity };
  }
  return null;
}

function ensureIndicatorLinks(questions, occurrences, indicators, changes, changeKeys) {
  var now = new Date().toISOString();
  var indicatorMap = {};
  indicators.forEach(function(indicator) { indicatorMap[indicator.indicatorId] = indicator; });

  questions.forEach(function(question) {
    var linked = question.indicatorId ? indicatorMap[question.indicatorId] : null;
    if (linked) {
      if (!question.indicatorLinkStatus || question.indicatorLinkStatus === 'PENDENTE_REVISAO') {
        question.indicatorLinkStatus = 'VINCULO_REVISADO';
      }
      question.category = linked.category;
      question.axis = linked.axis;
      return;
    }

    var definition = inferIndicatorDefinition(question.canonicalText);
    if (!definition) {
      question.indicatorId = '';
      question.indicatorLinkStatus = 'PENDENTE_REVISAO';
      addChange(
        changes,
        changeKeys,
        question.firstPeriod,
        'vinculo-indicador-pendente',
        question.questionId,
        question.canonicalText
      );
      return;
    }

    var resolved = resolveIndicatorDefinition(definition, indicators);
    if (resolved && resolved.conflict) {
      question.indicatorId = '';
      question.indicatorLinkStatus = 'CONFLITO';
      addChange(
        changes,
        changeKeys,
        question.firstPeriod,
        'conflito-indicador',
        question.questionId,
        resolved.conflict.map(function(item) { return item.indicator.indicatorId; }).join(', ')
      );
      return;
    }

    var indicator = resolved ? resolved.indicator : null;
    var method = resolved ? resolved.method : 'regra-automatica';
    if (!indicator) {
      indicator = {
        indicatorId: nextIndicatorId(indicators),
        name: definition.name,
        normalizedName: normalizeQuestionText(definition.name),
        conceptKey: questionConceptKey(question.canonicalText),
        category: definition.category,
        axis: definition.axis,
        description: 'Indicador criado automaticamente a partir de regras heuristicas.',
        status: 'ativo',
        reviewStatus: 'PENDENTE_REVISAO',
        firstPeriod: question.firstPeriod,
        lastPeriod: question.lastPeriod,
        createdAt: now,
        updatedAt: now
      };
      indicators.push(indicator);
      indicatorMap[indicator.indicatorId] = indicator;
      addChange(
        changes,
        changeKeys,
        question.firstPeriod,
        'indicador-criado',
        question.questionId,
        indicator.indicatorId + ' | ' + indicator.name
      );
    }

    question.indicatorId = indicator.indicatorId;
    question.indicatorLinkStatus = 'VINCULO_AUTOMATICO';
    question.category = indicator.category;
    question.axis = indicator.axis;
    question.updatedAt = now;
    addChange(
      changes,
      changeKeys,
      question.firstPeriod,
      'vinculo-indicador-automatico',
      question.questionId,
      indicator.indicatorId + ' | ' + method
    );
  });

  var questionMap = {};
  questions.forEach(function(question) { questionMap[question.questionId] = question; });
  occurrences.forEach(function(occurrence) {
    var question = questionMap[occurrence.questionId];
    occurrence.indicatorId = question ? question.indicatorId || '' : '';
    occurrence.indicatorLinkStatus = question ? question.indicatorLinkStatus || 'PENDENTE_REVISAO' : 'PENDENTE_REVISAO';
  });

  indicators.forEach(function(indicator) {
    var periods = occurrences.filter(function(occurrence) {
      return occurrence.indicatorId === indicator.indicatorId;
    }).map(function(occurrence) { return occurrence.periodKey; }).sort();
    if (!periods.length) {
      indicator.status = 'inativo';
      return;
    }
    indicator.firstPeriod = periods[0];
    indicator.lastPeriod = periods[periods.length - 1];
    indicator.status = 'ativo';
    indicator.updatedAt = now;
  });
}

function nextQuestionId(questions) {
  var maximum = questions.reduce(function(max, question) {
    var match = String(question.questionId || '').match(/^PERG-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return 'PERG-' + String(maximum + 1).padStart(4, '0');
}

function findQuestionMatch(sourceQuestion, questions, occurrences, usedQuestionIds) {
  var normalized = normalizeQuestionText(sourceQuestion.originalHeader || sourceQuestion.title);
  var exact = questions.find(function(question) {
    return question.normalizedText === normalized && !usedQuestionIds[question.questionId];
  });
  if (exact) return { question: exact, method: 'texto-exato', similarity: 1 };

  if (sourceQuestion.detectedCode) {
    var codeOccurrence = occurrences.slice().reverse().find(function(occurrence) {
      return occurrence.code === sourceQuestion.detectedCode && !usedQuestionIds[occurrence.questionId];
    });
    if (codeOccurrence) {
      var codeQuestion = questions.find(function(question) { return question.questionId === codeOccurrence.questionId; });
      if (codeQuestion) {
        var codeSimilarity = textSimilarity(normalized, codeQuestion.canonicalText);
        if (codeSimilarity < 0.3) {
          return { conflictQuestion: codeQuestion, method: 'conflito-codigo', similarity: codeSimilarity };
        }
        return {
          question: codeQuestion,
          method: 'codigo',
          similarity: Math.max(0.9, codeSimilarity)
        };
      }
    }
  }

  var best = null;
  questions.forEach(function(question) {
    if (usedQuestionIds[question.questionId]) return;
    var similarity = textSimilarity(normalized, question.canonicalText);
    if (!best || similarity > best.similarity) best = { question: question, similarity: similarity };
  });
  if (best && best.similarity >= AP_CONFIG.QUESTION_MATCH_THRESHOLD) {
    return { question: best.question, method: 'heuristica', similarity: best.similarity };
  }
  return null;
}

function addChange(changes, changeKeys, periodKey, eventType, questionId, details) {
  var key = [periodKey, eventType, questionId, details].join('|');
  if (changeKeys[key]) return;
  changeKeys[key] = true;
  changes.push({
    changeId: Utilities.getUuid(),
    timestamp: new Date().toISOString(),
    periodKey: periodKey,
    eventType: eventType,
    questionId: questionId,
    details: details
  });
  logApiEvent('info', 'question-' + eventType, { period: periodKey, questionId: questionId, details: details });
}

function previousPeriodKey(periodKey, occurrences) {
  var periods = {};
  occurrences.forEach(function(occurrence) {
    if (occurrence.periodKey < periodKey) periods[occurrence.periodKey] = true;
  });
  return Object.keys(periods).sort().pop() || '';
}

function synchronizeQuestionCatalog() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var store = openQuestionCatalogStore();
    var questions = readSheetRecords(store.questionsSheet);
    var indicators = readSheetRecords(store.indicatorsSheet);
    var occurrences = readSheetRecords(store.occurrencesSheet);
    var processed = readSheetRecords(store.processedSheet);
    var changes = readSheetRecords(store.changesSheet);
    var processedMap = {};
    processed.forEach(function(item) { processedMap[item.periodKey] = item; });
    var changeKeys = {};
    changes.forEach(function(change) {
      changeKeys[[change.periodKey, change.eventType, change.questionId, change.details].join('|')] = true;
    });

    var periods = getCatalogInternal().filter(function(item) { return item.compatible; }).slice().sort(function(a, b) {
      return a.periodKey.localeCompare(b.periodKey);
    });
    var processedNow = [];

    periods.forEach(function(period) {
      if (processedMap[period.periodKey] && processedMap[period.periodKey].fileUpdatedAt === period.updatedAt) return;

      occurrences = occurrences.filter(function(occurrence) { return occurrence.periodKey !== period.periodKey; });
      processed = processed.filter(function(item) { return item.periodKey !== period.periodKey; });
      var file = DriveApp.getFileById(period.fileId);
      if (!isFileInOfficialFolder(file)) throw new Error('Planilha fora da pasta oficial durante a catalogacao.');
      var data = readSpreadsheetData(file);
      var usedQuestionIds = {};
      var currentQuestionIds = {};
      var processedAt = new Date().toISOString();

      data.questions.forEach(function(sourceQuestion, index) {
        var originalText = sourceQuestion.originalHeader || sourceQuestion.title;
        var normalized = normalizeQuestionText(originalText);
        var match = findQuestionMatch(sourceQuestion, questions, occurrences, usedQuestionIds);
        var conflict = match && match.conflictQuestion ? match : null;
        var permanent;

        if (!match || !match.question) {
          var questionId = nextQuestionId(questions);
          permanent = {
            questionId: questionId,
            canonicalText: originalText,
            normalizedText: normalized,
            conceptKey: questionConceptKey(originalText),
            category: classifyQuestion(originalText),
            axis: sourceQuestion.section || sourceQuestion.eixo || 'Outros',
            type: sourceQuestion.type || 'text',
            firstPeriod: period.periodKey,
            lastPeriod: period.periodKey,
            status: 'ativa',
            reviewStatus: 'pendente de revisao',
            createdAt: processedAt,
            updatedAt: processedAt
          };
          questions.push(permanent);
          match = { question: permanent, method: 'nova', similarity: 1 };
          addChange(changes, changeKeys, period.periodKey, 'nova', questionId, originalText);
          addChange(
            changes,
            changeKeys,
            period.periodKey,
            'classificacao',
            questionId,
            permanent.category + ' | ' + permanent.conceptKey
          );
          if (conflict) {
            addChange(
              changes,
              changeKeys,
              period.periodKey,
              'conflito',
              questionId,
              'Codigo semelhante a ' + conflict.conflictQuestion.questionId + ', mas texto divergente.'
            );
          }
        } else {
          permanent = match.question;
          permanent.lastPeriod = period.periodKey;
          permanent.updatedAt = processedAt;
          if (normalized !== permanent.normalizedText) {
            addChange(changes, changeKeys, period.periodKey, 'alterada', permanent.questionId, originalText);
          }
          if (match.method === 'heuristica') {
            addChange(changes, changeKeys, period.periodKey, 'equivalente', permanent.questionId, originalText);
          }
        }

        usedQuestionIds[permanent.questionId] = true;
        currentQuestionIds[permanent.questionId] = true;
        occurrences.push({
          occurrenceId: period.periodKey + ':' + permanent.questionId,
          questionId: permanent.questionId,
          periodKey: period.periodKey,
          year: period.year,
          month: period.month,
          code: sourceQuestion.detectedCode || '',
          originalText: originalText,
          normalizedText: normalized,
          axis: sourceQuestion.section || sourceQuestion.eixo || 'Outros',
          type: sourceQuestion.type || 'text',
          order: index + 1,
          matchMethod: match.method,
          similarity: Number(match.similarity || 0).toFixed(4),
          fileUpdatedAt: period.updatedAt,
          processedAt: processedAt
        });
      });

      var previousKey = previousPeriodKey(period.periodKey, occurrences);
      if (previousKey) {
        occurrences.filter(function(occurrence) { return occurrence.periodKey === previousKey; }).forEach(function(previous) {
          if (!currentQuestionIds[previous.questionId]) {
            addChange(changes, changeKeys, period.periodKey, 'removida', previous.questionId, 'Ausente em ' + period.periodKey);
          }
        });
      }

      processed.push({
        periodKey: period.periodKey,
        fileUpdatedAt: period.updatedAt,
        processedAt: processedAt,
        questionCount: data.questions.length
      });
      processedNow.push(period.periodKey);
    });

    var allPeriods = processed.map(function(item) { return item.periodKey; }).sort();
    var latestPeriod = allPeriods.length ? allPeriods[allPeriods.length - 1] : '';
    questions.forEach(function(question) {
      var questionPeriods = occurrences.filter(function(occurrence) {
        return occurrence.questionId === question.questionId;
      }).map(function(occurrence) { return occurrence.periodKey; }).sort();
      if (!questionPeriods.length) {
        question.status = 'inativa';
        return;
      }
      question.firstPeriod = questionPeriods[0];
      question.lastPeriod = questionPeriods[questionPeriods.length - 1];
      question.status = question.lastPeriod === latestPeriod ? 'ativa' : 'inativa';
    });

    ensureIndicatorLinks(questions, occurrences, indicators, changes, changeKeys);

    replaceSheetRecords(store.questionsSheet, QUESTION_HEADERS, questions);
    replaceSheetRecords(store.indicatorsSheet, INDICATOR_HEADERS, indicators);
    replaceSheetRecords(store.occurrencesSheet, OCCURRENCE_HEADERS, occurrences);
    replaceSheetRecords(store.processedSheet, PROCESSED_HEADERS, processed);
    replaceSheetRecords(store.changesSheet, CHANGE_HEADERS, changes);

    return {
      questions: questions,
      indicators: indicators,
      occurrences: occurrences,
      processed: processed,
      changes: changes,
      processedNow: processedNow,
      latestPeriod: latestPeriod
    };
  } finally {
    lock.releaseLock();
  }
}

function questionSummary(question) {
  return {
    questionId: question.questionId,
    text: question.canonicalText,
    concept: question.conceptKey,
    category: question.category,
    axis: question.axis,
    indicatorId: question.indicatorId || '',
    indicatorLinkStatus: question.indicatorLinkStatus || 'PENDENTE_REVISAO',
    type: question.type,
    firstPeriod: question.firstPeriod,
    lastPeriod: question.lastPeriod,
    status: question.status,
    reviewStatus: question.reviewStatus
  };
}

function indicatorSummary(indicator) {
  return {
    indicatorId: indicator.indicatorId,
    name: indicator.name,
    concept: indicator.conceptKey,
    category: indicator.category,
    axis: indicator.axis,
    description: indicator.description,
    status: indicator.status,
    reviewStatus: indicator.reviewStatus,
    firstPeriod: indicator.firstPeriod,
    lastPeriod: indicator.lastPeriod
  };
}

function buildIndicatorHierarchy(indicators, questions) {
  var categories = {};
  indicators.forEach(function(indicator) {
    if (!categories[indicator.category]) categories[indicator.category] = {};
    if (!categories[indicator.category][indicator.axis]) categories[indicator.category][indicator.axis] = [];
    categories[indicator.category][indicator.axis].push({
      indicatorId: indicator.indicatorId,
      name: indicator.name,
      questionIds: questions.filter(function(question) {
        return question.indicatorId === indicator.indicatorId;
      }).map(function(question) { return question.questionId; }),
      questions: questions.filter(function(question) {
        return question.indicatorId === indicator.indicatorId;
      }).map(function(question) {
        return {
          questionId: question.questionId,
          text: question.canonicalText,
          firstPeriod: question.firstPeriod,
          lastPeriod: question.lastPeriod
        };
      })
    });
  });

  return Object.keys(categories).sort().map(function(category) {
    return {
      category: category,
      axes: Object.keys(categories[category]).sort().map(function(axis) {
        return { axis: axis, indicators: categories[category][axis] };
      })
    };
  });
}

function occurrenceSummary(occurrence, questionsById) {
  var question = questionsById[occurrence.questionId] || {};
  return {
    questionId: occurrence.questionId,
    period: occurrence.periodKey,
    code: occurrence.code,
    originalText: occurrence.originalText,
    canonicalText: question.canonicalText || '',
    matchMethod: occurrence.matchMethod,
    similarity: Number(occurrence.similarity || 0)
  };
}

function buildPeriodComparison(periodA, periodB, state) {
  if (!periodA || !periodB) throw new Error('Informe os dois periodos para comparacao.');
  var questionsById = {};
  state.questions.forEach(function(question) { questionsById[question.questionId] = question; });
  var left = {};
  var right = {};
  state.occurrences.forEach(function(occurrence) {
    if (occurrence.periodKey === periodA) left[occurrence.questionId] = occurrence;
    if (occurrence.periodKey === periodB) right[occurrence.questionId] = occurrence;
  });
  if (!Object.keys(left).length || !Object.keys(right).length) {
    throw new Error('Um dos periodos ainda nao possui perguntas catalogadas.');
  }

  var equal = [];
  var altered = [];
  var removed = [];
  var added = [];
  Object.keys(left).forEach(function(questionId) {
    if (!right[questionId]) removed.push(occurrenceSummary(left[questionId], questionsById));
    else if (left[questionId].normalizedText === right[questionId].normalizedText) {
      equal.push(occurrenceSummary(right[questionId], questionsById));
    } else {
      altered.push({
        questionId: questionId,
        before: left[questionId].originalText,
        after: right[questionId].originalText,
        similarity: Number(right[questionId].similarity || 0)
      });
    }
  });
  Object.keys(right).forEach(function(questionId) {
    if (!left[questionId]) added.push(occurrenceSummary(right[questionId], questionsById));
  });
  return { periodA: periodA, periodB: periodB, equal: equal, altered: altered, removed: removed, added: added };
}

function buildQuestionCatalogContract() {
  var state = synchronizeQuestionCatalog();
  var questionsById = {};
  state.questions.forEach(function(question) { questionsById[question.questionId] = question; });
  var periods = state.processed.map(function(item) { return item.periodKey; }).sort();
  var latest = periods.length ? periods[periods.length - 1] : '';
  var previous = periods.length > 1 ? periods[periods.length - 2] : '';
  var latestOccurrences = state.occurrences.filter(function(item) { return item.periodKey === latest; });
  var comparison = previous && latest ? buildPeriodComparison(previous, latest, state) : null;

  return {
    success: true,
    catalog: state.questions.map(questionSummary),
    indicators: state.indicators.map(indicatorSummary),
    hierarchy: buildIndicatorHierarchy(state.indicators, state.questions),
    summary: {
      totalQuestions: state.questions.length,
      totalIndicators: state.indicators.length,
      linkedQuestions: state.questions.filter(function(question) { return Boolean(question.indicatorId); }).length,
      pendingIndicatorLinks: state.questions.filter(function(question) {
        return question.indicatorLinkStatus === 'PENDENTE_REVISAO';
      }).map(questionSummary),
      indicatorConflicts: state.questions.filter(function(question) {
        return question.indicatorLinkStatus === 'CONFLITO';
      }).map(questionSummary),
      processedPeriods: periods.length,
      processedNow: state.processedNow,
      latestPeriod: latest,
      newQuestions: state.questions.filter(function(question) { return question.firstPeriod === latest; }).map(questionSummary),
      alteredQuestions: comparison ? comparison.altered : [],
      equivalentQuestions: latestOccurrences.filter(function(item) {
        return item.matchMethod === 'heuristica' || item.matchMethod === 'codigo';
      }).map(function(item) { return occurrenceSummary(item, questionsById); }),
      unclassifiedQuestions: state.questions.filter(function(question) {
        return question.category === 'Nao classificada';
      }).map(questionSummary),
      comparison: comparison
    },
    history: state.changes.slice().sort(function(a, b) {
      return String(b.timestamp).localeCompare(String(a.timestamp));
    }).slice(0, 100),
    updatedAt: new Date().toISOString()
  };
}

function buildComparisonContract(periodA, periodB) {
  var state = synchronizeQuestionCatalog();
  return {
    success: true,
    comparison: buildPeriodComparison(periodA, periodB, state),
    updatedAt: new Date().toISOString()
  };
}

function enrichQuestionsWithIndicators(periodKey, questions) {
  try {
    var spreadsheet = findExistingCatalogSpreadsheet();
    if (!spreadsheet) return { questions: questions, indicators: [], coverage: { linked: 0, pending: questions.length } };
    var occurrencesSheet = spreadsheet.getSheetByName('Ocorrencias');
    var questionsSheet = spreadsheet.getSheetByName('Perguntas');
    var indicatorsSheet = spreadsheet.getSheetByName('Indicadores');
    if (!occurrencesSheet || !questionsSheet || !indicatorsSheet) {
      return { questions: questions, indicators: [], coverage: { linked: 0, pending: questions.length } };
    }

    var occurrences = readSheetRecords(occurrencesSheet).filter(function(item) { return item.periodKey === periodKey; });
    var permanentQuestions = {};
    readSheetRecords(questionsSheet).forEach(function(item) { permanentQuestions[item.questionId] = item; });
    var indicators = {};
    readSheetRecords(indicatorsSheet).forEach(function(item) { indicators[item.indicatorId] = item; });
    var usedIndicators = {};
    var enriched = questions.map(function(question) {
      var normalized = normalizeQuestionText(question.originalHeader || question.title);
      var occurrence = occurrences.find(function(item) {
        return item.normalizedText === normalized
          || (question.detectedCode && item.code === question.detectedCode);
      });
      if (!occurrence) return question;
      var permanent = permanentQuestions[occurrence.questionId] || {};
      var indicator = indicators[occurrence.indicatorId] || null;
      if (indicator) usedIndicators[indicator.indicatorId] = indicator;
      return Object.assign({}, question, {
        permanentId: occurrence.questionId,
        indicatorId: occurrence.indicatorId || '',
        indicatorLinkStatus: occurrence.indicatorLinkStatus || 'PENDENTE_REVISAO',
        category: indicator ? indicator.category : permanent.category || 'Nao classificada',
        indicatorAxis: indicator ? indicator.axis : '',
        indicatorName: indicator ? indicator.name : ''
      });
    });
    var linked = enriched.filter(function(question) { return Boolean(question.indicatorId); }).length;
    return {
      questions: enriched,
      indicators: Object.keys(usedIndicators).map(function(id) { return indicatorSummary(usedIndicators[id]); }),
      coverage: { total: enriched.length, linked: linked, pending: enriched.length - linked }
    };
  } catch (error) {
    logApiEvent('warning', 'indicator-enrichment', { period: periodKey, message: error.message || String(error) });
    return { questions: questions, indicators: [], coverage: { linked: 0, pending: questions.length } };
  }
}
