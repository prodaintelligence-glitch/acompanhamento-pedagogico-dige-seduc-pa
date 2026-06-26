export function renderSmartMessages(container, messages) {
  if (!messages.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="smart-messages">
      ${messages.map((message) => `<p data-type="${message.type}">${message.text}</p>`).join('')}
    </div>
  `;
}
