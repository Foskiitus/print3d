const internationalization = {
  "locales": [
    "pt",
    "en"
  ],
  "defaultLocale": "pt"
};
const routing = {
  "mode": "prefix-no-default",
  "storage": [
    "cookie",
    "header"
  ],
  "basePath": ""
};
const editor = {
  "editorURL": "http://localhost:8000",
  "cmsURL": "https://app.intlayer.org",
  "backendURL": "https://back.intlayer.org",
  "port": 8000,
  "enabled": false,
  "dictionaryPriorityStrategy": "local_first",
  "liveSync": true,
  "liveSyncPort": 4000,
  "liveSyncURL": "http://localhost:4000"
};
const log = {
  "mode": "default",
  "prefix": "\u001b[38;5;239m[intlayer] \u001b[0m"
};
const metadata = {
  "name": "Intlayer",
  "version": "8.5.1",
  "doc": "https://intlayer.org/docs"
};
const configuration = { internationalization, routing, editor, log, metadata };

export { internationalization, routing, editor, log, metadata, configuration };
export default configuration;
