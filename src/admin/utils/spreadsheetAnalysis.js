import { detectQuestions, detectQuestionType } from '../../utils/detectQuestions.js';
import { getDistribution } from '../../utils/statistics.js';

export function analyzeSpreadsheetRows(rows) {
  const questions = detectQuestions(rows);
  const axes = new Set(questions.map((question) => question.eixo));
  const openQuestions = questions.filter((question) => detectQuestionType(rows, question.key) === 'text');
  const closedQuestions = questions.filter((question) => detectQuestionType(rows, question.key) !== 'text');
  const categories = questions.reduce((acc, question) => {
    acc[question.code] = Object.keys(getDistribution(rows, question.key));
    return acc;
  }, {});

  return {
    totalQuestions: questions.length,
    totalAxes: axes.size,
    ignoredQuestions: [],
    openQuestions: openQuestions.map((question) => question.code),
    closedQuestions: closedQuestions.map((question) => question.code),
    categories,
    firstQuestions: questions.slice(0, 5).map((question) => `${question.code} - ${question.title}`)
  };
}
