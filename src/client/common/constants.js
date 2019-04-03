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
 * @Date:   2019-04-01T16:06:05+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-03T11:48:03+11:00
 */

export const PAGES = {
  HOME: 'home',
  APP: 'app',
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard',
  SUPPORT: 'support',
  LANDING: 'landing',
  SHARED: 'shared',
};

export const ANTD_BUTTON_TYPES = {
  PRIMARY: 'primary',
  DASHED: 'dashed',
  DANGER: 'danger',
  GHOST: 'ghost',
};
export const TOTAL_FILE_SIZE_LIMIT = 1000000000;
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
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const DOMAINS = {
  ID: 'https://id.provendb.com',
  PROVENDOCS: 'https://provendocs.com',
  API: 'https://api.provendb.com',
  PROVENDB: 'https://provendb.com',
};

export const PROOF_STATUS = {
  VALID: 'Valid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  SUBMITTED: 'Submitted',
  UNPROVEN: 'Unproven',
};
