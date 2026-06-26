export function getClickedCategory(elements, labels) {
  if (!elements.length) return '';
  return labels[elements[0].index] ?? '';
}
