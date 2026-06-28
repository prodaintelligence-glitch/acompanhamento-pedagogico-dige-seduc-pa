function getOfficialFolder() {
  try {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch (error) {
    throw new Error('Pasta oficial nao encontrada ou sem permissao de acesso.');
  }
}

function isFileInOfficialFolder(file) {
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === DRIVE_FOLDER_ID) return true;
  }
  return false;
}

function isIgnoredDriveFile(file) {
  var name = normalizeText(file.getName());
  return file.isTrashed()
    || file.getName() === AP_CONFIG.QUESTION_CATALOG_FILE_NAME
    || name.indexOf('~') === 0
    || /(?:^|\s)(temporario|temporaria|rascunho|backup)(?:\s|$)/.test(name);
}

function matchesOfficialFileName(fileName) {
  var normalized = normalizeText(fileName);
  if (!parsePeriodFromName(fileName)) return false;
  var hasConfiguredPrefix = AP_CONFIG.OFFICIAL_FILE_PREFIXES.some(function(prefix) {
    return normalized.indexOf(prefix) === 0;
  });
  var hasMonthPrefix = AP_MONTHS.some(function(month) {
    return month.aliases.some(function(alias) { return normalized.indexOf(alias) === 0; });
  });
  var hasNumericPattern = /(?:^|[^0-9])(?:0?[1-9]|1[0-2])[^0-9]+(?:19|20)\d{2}(?:[^0-9]|$)/.test(normalized)
    || /(?:19|20)\d{2}[^0-9]+(?:0?[1-9]|1[0-2])(?:[^0-9]|$)/.test(normalized);
  return hasConfiguredPrefix || hasMonthPrefix || hasNumericPattern;
}

function listOfficialSpreadsheetFiles() {
  var iterator = getOfficialFolder().getFilesByType(MimeType.GOOGLE_SHEETS);
  var files = [];
  while (iterator.hasNext()) {
    var file = iterator.next();
    if (!isIgnoredDriveFile(file)) files.push(file);
  }
  return files;
}
