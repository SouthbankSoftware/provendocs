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
import zlib from 'zlib';
import ImageReader from 'file2html-image';
import * as file2html from 'file2html';
import sizeOf from 'object-sizeof';
import { fileAPIFormat } from '../modules/winston.config';
import { MIMETYPES, LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';

const mongo = require('mongodb');

const { Binary } = mongo;
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

/**
 * Extract the raw html from the email document and add it as an attribute.
 * @param {Object} document - An object containing the raw email and added fields.
 * @returns {Object} The document with the html attribute added.
 */
export const extractHTML = (document: Object) => new Promise<any>((resolve, reject) => {
  try {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Extracting HTML from email.',
      document,
    });
    const { email } = document;
    // First, break the email into segments by content type:
    const splitEmail = email.split(/\n\n--/g);
    // const emailMetadata = splitEmail[0]; // First entry contains recieved etc...
    // Now iterate through each entry, checking disposition and content type.
    let html = false;
    splitEmail.forEach((value, emailIndex) => {
      // We are only interested in inline or attachment content.
      if (value.match(/Content-Disposition: inline/)) {
        // We are only interested in the HTML representation.
        if (value.match(/Content-Type: text\/html/)) {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Found HTML entry.',
            value,
          });
          const splitHTML = value.split(/\n/g);
          splitHTML.forEach((htmlValue, index) => {
            // Capture all the lines from <html to the end.
            if (htmlValue.match(/<html/)) {
              html = true;
              document.html = splitHTML.slice(index, splitHTML.length).join('\n');
              resolve(document);
              // eslint-disable-next-line
                return;
            }
          });
        }
      }
      if (emailIndex === splitEmail.length && !html) {
        // If we haven't found html by now, reject.
        reject(new Error('Unable to find HTML in email.'));
      }
    });
    resolve(document);
  } catch (e) {
    reject(e);
  }
});

/**
 * Extract a list of attachments from the email document and add them in a formatted array.
 * @param {Object} document - An object containing the raw email and added fields.
 * @returns {Object} The document with the attachment array added.
 */
export const extractAttachments = (document: Object) => new Promise<any>((resolve, reject) => {
  try {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'Extracting Attachments from email.',
      document,
    });
    const { email } = document;
    document.attachments = [];
    // First, get everything AFTER the html segment.
    const postHTML = email.split('Content-Type: text/html')[1];
    const splitEmail = postHTML.split(/--/g);

    if (splitEmail.length === 0) {
      resolve(document);
    } else {
      // Now iterate through each entry, checking disposition and content type.
      splitEmail.forEach((value, emailIndex) => {
        // We are only interested in sections with content types.
        if (value.match(/Content-Type/g)) {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Found an attachment: ',
            value,
          });
          // Split attachment by line.
          const splitValue = value.split('\n\n');
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Split by double line breaks: ',
            splitValue,
          });
          // Extract metadata values.
          const metadata = splitValue[0].split('\n');
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Metadata: ',
            metadata,
          });
          const binaryData = splitValue[1].replace(/\n/g, '');

          // Fix up Mimetypes:
          let mimetype = metadata[1].split(': ')[1];
          if (mimetype === MIMETYPES.OCTET_STREAM) {
            mimetype = MIMETYPES.PDF;
          }

          // Fix up Encoding:
          let encoding = metadata[2].split(': ')[1];
          if (encoding === 'base64') {
            encoding = '7bit';
          }

          // Get Name Out:
          let name = `UNKNOWN_${Date.now()}`;
          for (let i = 0; i < metadata.length; i += 1) {
            if (metadata[i].match('filename')) {
              name = metadata[i].split('="')[1].slice(0, -1);
            }
          }

          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Creating Attachemnt Document... ',
          });
          const newAttachment = {
            mimetype,
            encoding,
            name,
            size: sizeOf(binaryData),
            binaryData,
          };
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Attachment document: ',
            mimetype,
            encoding,
            name,
            size: sizeOf(binaryData),
          });
          document.attachments.push(newAttachment);
        }
        if (emailIndex === splitEmail.length - 1) {
          resolve(document);
        }
      });
    }
  } catch (e) {
    reject(e);
  }
});

/**
 * Extract a list of metadata fields from the email document and add them in a formatted object.
 * @param {Object} document - An object containing the raw email and added fields.
 * @returns {Object} The document with the metadata object added.
 */
export const extractMetadata = (document: Object) => new Promise<any>((resolve, reject) => {
  try {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Extracting Metadata from email.',
      document,
    });
    document.metadata = { date: 'Example Date', received: 'Example received' };
    resolve(document);
  } catch (e) {
    reject(e);
  }
});

/**
 * Create a HTML version of an email for displaying.
 * @param {string} email - The text representation of the raw email.
 * @returns {string} A HTML representation of the email for displaying.
 */
export const convertEmailToHTML = (emailDoc: Object) => new Promise<string>((resolve) => {
  const { html } = emailDoc;
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Converting email to html.',
    html,
  });
  resolve(html);
});

/**
 * Take an email in raw format and convert to a binary format.
 * @param {*} document - An object with the email and it's metadata.
 * @returns {Object} Object with binaryData field added.
 */
export const convertEmailToBinary = (document: Object) => new Promise<any>((resolve, reject) => {
  try {
    const {
      subject, to, from, headers, attachments,
    } = document;
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Converting email to binary',
      subject,
      to,
      from,
      html: '[REDACTED]',
      headers,
      attachments,
    });

    // eslint-disable-next-line
      const binData = new Buffer(JSON.stringify(document)).toString('base64');
    zlib.deflate(binData, (zlibErr, compressedBuffer) => {
      if (zlibErr) {
        reject(zlibErr);
      } else {
        document.binaryData = Binary(compressedBuffer);
        document.name = `email_${subject}.html`;
        resolve(document);
      }
    });
  } catch (e) {
    reject(e);
  }
});

/**
 * Take a document object and add some mandetory fields so it can be inserted into MongoDB.
 * @param {*} document - The initial object containing email information.
 * @returns {Object} Object ready to be put into MongoDB.
 */
export const createEmailDocument = (document: Object) => new Promise<any>((resolve, reject) => {
  try {
    const { binaryData, subject, name } = document;
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Creating document for email',
      subject,
      name,
    });

    const now = new Date(Date.now()).toISOString();
    const size = sizeOf(binaryData);
    resolve({
      name: `${subject}_${now}`,
      mimetype: 'email',
      encoding: '7bit',
      binaryData,
      size,
      uploadedAt: now,
      tags: ['email'],
      comment: 'This file was uploaded by being emailed to upload@upload.provendocs.com',
    });
  } catch (e) {
    reject(e);
  }
});
