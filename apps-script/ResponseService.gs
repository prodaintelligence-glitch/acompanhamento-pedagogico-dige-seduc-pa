function responseTimestamp() {
  return new Date().toISOString();
}

function responseData(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return payload;
  var data = Object.assign({}, payload);
  delete data.success;
  delete data.message;
  delete data.error;
  delete data.details;
  delete data.timestamp;
  return data;
}

function responseCount(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (!payload || typeof payload !== 'object') return 0;
  if (typeof payload.count === 'number') return payload.count;
  if (Array.isArray(payload.rows)) return payload.rows.length;
  return 0;
}

function successResponse(payload, message, options) {
  options = options || {};
  var response = {
    success: true,
    data: responseData(payload || {}),
    count: typeof options.count === 'number' ? options.count : responseCount(payload),
    message: message || '',
    timestamp: responseTimestamp()
  };
  if (options.metadata) response.metadata = options.metadata;
  return response;
}

function errorResponse(error) {
  return {
    success: false,
    error: publicErrorMessage(error),
    details: error && error.message ? String(error.message).slice(0, 500) : 'Erro inesperado na API.',
    code: publicErrorCode(error),
    timestamp: responseTimestamp()
  };
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
