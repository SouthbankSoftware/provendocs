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
import winston from 'winston';
import TextReader from 'file2html-text';
import OOXMLReader from 'file2html-ooxml';
import ImageReader from 'file2html-image';
import * as file2html from 'file2html';
import { MIMETYPES, LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';
import { fileAPIFormat } from '../modules/winston.config';

file2html.config({
  readers: [TextReader, OOXMLReader, ImageReader],
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
      json: true,
      colorize: true,
      format: fileAPIFormat,
    }),
  ],
});

export const fixBinaryData = (binaryData: string, mimetype: string) => new Promise<any>((resolve) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Fixing binary data for an object',
    mimetype,
  });
  switch (mimetype) {
    case MIMETYPES.TEXT:
      resolve({
        'font-size': '4px',
      });
      return;
    case MIMETYPES.PNG:
      resolve(`data:image/png;base64,${binaryData}`);
      return;
    case MIMETYPES.JEPN:
      resolve(`data:image/jpeg;base64,${binaryData}`);
      return;
    default:
      resolve(binaryData);
  }
});

export const placeholder = () => {};
