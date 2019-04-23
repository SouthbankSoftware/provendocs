/* @flow
 * provendocs
 * Copyright (C) 2019  Southbank Software Ltd.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * @Author: Michael Harrison
 * @Date:   2019-03-29T10:46:51+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-03T09:18:20+11:00
 */

export const SUPPORTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'application/json',
  'image/svg+xml',
  'text/plain',
  'text/html',
  'text/javascript',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/x-sh',
];

export const EXTENSIONS = {
  EXCEL: '.xlsx',
  DOCX: '.docx',
  DOC: '.doc',
};

export const COLLECTION_NAMES = {
  SHARING_INFO: 'file_sharing_pdbignore',
  USER_INFO: 'user_info_pdbignore',
  CONFIG_INFO: 'app_config_pdbignore',
};

export const STORAGE_LIMITS = {
  DEFAULT_SIZE: 1000000000,
  DEFAULT_DOCUMENTS: 100,
};

export const DOMAINS = {
  ID: process.env.USER_MODULE_URL || 'http://localhost:8000',
  PROVENDOCS:
    process.env.DOCS_URL
    || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:8888'),
  API: process.env.API_URL || 'http://localhost:8080',
  INTERNAL_API: process.env.INTERNAL_API_URL || 'http://localhost:8080', // TODO: this is just added for the local kubernetes deployment
  THUMBS_MODULE_URL: process.env.THUMBS_MODULE_URL || 'http://localhost:8889',
};

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

export const LOG_LEVELS = {
  SILLY: 'silly',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

export const ENV_TYPES = {
  DEV: 'DEV',
  PROD: 'PROD',
  TEST: 'TEST',
};

export const STACKDRIVER_SEVERITY = {
  DEFAULT: 'DEFAULT',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  NOTICE: 'NOTICE',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  ALERT: 'ALERT',
  EMERGENCY: 'EMERGENCY',
};

export const ERROR_CODES = {
  FAILED_TO_SUBMIT_PROOF: 1001,
  FAILED_TO_READ_FILE: 1002,
  FAILED_TO_WRITE_FILE: 1003,
  MAMMOTH_DOCX_2_HTML_ERROR: 1004,
};

export const REFERRAL_EVENTS = {
  NEW_PARTICIPANT_ADDED: 'NEW_PARTICIPANT_ADDED',
  PARTICIPANT_REACHED_A_GOAL: 'PARTICIPANT_REACHED_A_GOAL',
  CAMPAIGN_ENDED: 'CAMPAIGN_ENDED',
};
