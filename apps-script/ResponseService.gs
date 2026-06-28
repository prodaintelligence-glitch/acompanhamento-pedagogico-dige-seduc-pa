function responseTimestamp() {
  return new Date().toISOString();
}

function responseData(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  var data = Object.assign({}, payload);
  delete data.success;
  delete data.message;
  delete data.error;
  delete data.details;
  delete data.timestamp;
  return data;
}

function successResponse(payload, message) {
  return {
    success: true,
    data: responseData(payload || {}),
    message: message || '',
    timestamp: responseTimestamp()
  };
}

function errorResponse(error) {
  return {
    success: false,
    error: publicErrorCode(error),
    details: publicErrorMessage(error),
    timestamp: responseTimestamp()
  };
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
