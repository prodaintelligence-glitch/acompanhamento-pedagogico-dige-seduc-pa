function logApiEvent(level, action, details) {
  var entry = {
    timestamp: new Date().toISOString(),
    level: level,
    action: action,
    details: details || {}
  };

  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
