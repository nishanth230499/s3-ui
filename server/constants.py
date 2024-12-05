PASSWORD_SCHEMA = {
  "type": "string",
  "minLength": 8,
}

ZIP_FILENAME_SCHEMA = {
  "type": "string",
  "pattern": "^[a-zA-Z0-9][a-zA-Z0-9 ]*.zip$"
}