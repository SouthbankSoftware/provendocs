// @flow
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
