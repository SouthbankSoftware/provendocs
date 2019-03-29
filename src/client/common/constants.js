/*
 * @Author: Michael Harrison
 * @Date:   2019-03-25T15:52:10+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:54:34+11:00
 */
export const PAGES = {
  HOME: 'home',
  APP: 'app',
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard',
  SUPPORT: 'support',
  LANDING: 'landing',
};

export const ANTD_BUTTON_TYPES = {
  PRIMARY: 'primary',
  DASHED: 'dashed',
  DANGER: 'danger',
  GHOST: 'ghost',
};
export const TOTAL_FILE_SIZE_LIMIT = 350000000;
export const FILE_SIZE_LIMIT = 16777216;
export const FILE_UPLOAD_LIMIT = 12;

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
  FACEBOOK: 'facebook',
};

export const SUPPORTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'application/json',
  'image/svg+xml',
  'text/plain',
  'text/html',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '',
];

export const MIMETYPES = {
  EMAIL: 'email',
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  SVG: 'image/svg+xml',
  OCTET_STREAM: 'application/octet-stream',
  JSON: 'application/json',
  TEXT: 'text/plain',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  HTML: 'text/html',
  JS: 'text/javascript',
  SHELL: 'text/x-sh',
};

export const DOMAINS = {
  ID: 'id.provendb.com',
  PROVENDOCS: 'provendocs.com',
  API: 'api.provendb.com',
};

export const PROOF_STATUS = {
  VALID: 'Valid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  SUBMITTED: 'Submitted',
  UNPROVEN: 'Unproven',
};
