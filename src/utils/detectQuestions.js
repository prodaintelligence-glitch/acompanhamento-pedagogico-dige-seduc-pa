import { ignoredQuestions } from '../config/ignoredQuestions.js';
import { detectPersonalFields } from './detectPersonalFields.js';

const QUESTION_START_INDEX = 14;

export function getQuestionCode(label) {
  const match = String(label).trim().match(/^(\d+\.\d+)/);
  return match ? match[1] : '';
}

export function getQuestionSection(label) {
  const code = getQuestionCode(label);
  return code ? `Eixo ${code.split('.')[0]}` : 'Sem eixo';
}

export function detectQuestions(rows) {
  if (!rows.length) return [];

  const headers = Object.keys(rows[0]);
  const personalFields = detectPersonalFields(headers);
  const questionHeaders = headers.filter((header, index) => {
    const code = getQuestionCode(header);
    if (!code) return false;
    if (ignoredQuestions.includes(code)) return false;
    return index >= QUESTION_START_INDEX || !personalFields.has(header);
  });

  return questionHeaders.map((header) => {
    const code = getQuestionCode(header);

    return {
      id: code,
      key: header,
      code,
      eixo: code.split('.')[0],
      section: getQuestionSection(header),
      titulo: header.replace(/^\d+\.\d+\s*-\s*/, ''),
      title: header.replace(/^\d+\.\d+\s*-\s*/, ''),
      originalHeader: header,
      type: 'categorical'
    };
  });
}

export function detectQuestionType(rows, questionKey) {
  const values = rows.map((row) => row[questionKey]).filter((value) => value !== undefined && value !== null && value !== '');
  const unique = [...new Set(values.map(String))];
  const lower = unique.map((value) => value.toLowerCase());

  if (!values.length) return 'empty';
  if (values.every((value) => !Number.isNaN(Number(value)))) return 'numeric';
  if (lower.every((value) => ['sim', 'nao', 'não', 'parcialmente'].includes(value))) return 'boolean';
  if (unique.length <= 8 && values.every((value) => String(value).length <= 60)) return 'categorical';
  return 'text';
}
