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

import fs from 'fs';
import _ from 'lodash';
import winston from 'winston';
import Path from 'path';
import base64Img from 'base64-img';
import TextReader from 'file2html-text';
import OOXMLReader from 'file2html-ooxml';
import ImageReader from 'file2html-image';
import 'regenerator-runtime/runtime'; // This is required to support Async function without using babel/polyfill
import * as file2html from 'file2html';
import {
  MIMETYPES,
  ERROR_CODES,
  LOG_LEVELS,
  STACKDRIVER_SEVERITY,
  EXTENSIONS,
} from '../common/constants';
import { fileAPIFormat } from '../modules/winston.config';

// $FlowFixMe
const { Worker } = require('worker_threads'); // eslint-disable-line

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
 * Wrapper function for starting a new worker thread to compress a file.
 * @param {string} filePath - The path of the file to be compressed, this has to be absolute path.
 * @returns {Buffer} - A buffer containing the compressed file data.
 */
const compressFile = (filePath: string) => new Promise<Buffer>((resolve, reject) => {
  const worker = new Worker(Path.join(__dirname, './workers/compressWorker.js'), {
    workerData: { filePath },
  });
  worker.on('message', (result) => {
    if (!result.ok) {
      reject(result.err);
    } else {
      resolve(Buffer.from(result.buffer));
    }
  });
  worker.on('error', (err) => {
    reject(
      new Error(`Worker Thread encountered an error while trying to decompress a file: ${err}`),
    );
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      reject(new Error(`Worker stopped with exit code ${code}`));
    }
  });
});

/**
 * Wrapper function which creates a worker thread to decompress a file.
 * @param {Buffer} compressedBuffer - A buffer containing the compressed file data.
 * @returns {Buffer} - A buffer containing the decompressed file data.
 */
const decompressFile = compressedBuffer => new Promise<Buffer>((resolve, reject) => {
  const worker = new Worker(Path.join(__dirname, './workers/decompressWorker.js'), {
    workerData: { compressedBuffer },
  });
  worker.on('message', (result) => {
    if (!result.ok) {
      reject(result.err);
    } else {
      resolve(Buffer.from(result.buffer));
    }
  });
  worker.on('error', (err) => {
    reject(
      new Error(`Worker Thread encountered an error while trying to decompress a file: ${err}`),
    );
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      reject(new Error(`Worker stopped with exit code ${code}`));
    }
  });
});

/**
 * Checks if the files to be uploaded would cause a user to go over their usage limit.
 * @param {Object} storageDocument - A document containing the current usage of the users storage limit.
 * @param {Object} files - A list of files the user is trying to upload.
 * @returns {boolean} - false if upload would exceed storage, true otherwise.
 */
export const doesUploadExceedRemainingStorage = (storageDocument: Object, files: Object) => new Promise<any>((resolve) => {
  const totalFilesNumber = files.length;
  let totalFilesSize = 0;
  let filesAdded = 0;
  const storage = storageDocument[0] || storageDocument;
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Size limits:',
    storage,
    numFilesToUpload: files.length,
  });
  if (totalFilesNumber + storage.documentsUsed > storage.documentsLimit) {
    resolve({ exceed: true });
  } else {
    _.forEach(files, (file) => {
      totalFilesSize += file.size;
      filesAdded += 1;

      if (filesAdded === totalFilesNumber) {
        if (totalFilesSize + storage.storageUsed > storage.storageLimit) {
          resolve({ exceed: true });
        } else {
          resolve({ exceed: false, newStorageUsed: totalFilesSize + storage.storageUsed, newDocumentsUsed: totalFilesNumber + storage.documentsUsed });
        }
      }
    });
  }
});

export const convertToBinary = (files: Object) => new Promise<Array<Object>>((resolve, reject) => {
  // For each file:
  const binaryFiles = [];
  logger.log({ level: LOG_LEVELS.DEBUG, message: 'Converting files to binary', files });
  _.forEach(files, (file) => {
    // START HACK -> Files uploaded via drag and drop do not have their proper mime type associated.
    // therefore we have to guess the extension based on the file name. There may be more file types this
    // is needed for.
    if (file.originalname.endsWith(EXTENSIONS.EXCEL)) {
      file.mimetype = MIMETYPES.XLSX;
    } else if (file.originalname.endsWith(EXTENSIONS.DOC)) {
      file.mimetype = MIMETYPES.DOC;
    } else if (file.originalname.endsWith(EXTENSIONS.DOCX)) {
      file.mimetype = MIMETYPES.DOCX;
    }
    // END HACK

    const {
      path, originalname, mimetype, encoding,
    } = file;
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Converting file to binary',
      path,
      mimetype,
      encoding,
      originalname,
    });

    compressFile(path)
      .then((encodedFile: Buffer) => {
        logger.log({
          level: LOG_LEVELS.INFO,
          severity: STACKDRIVER_SEVERITY.INFO,
          message: 'Size of compressed file buffer',
          fileBufferLength: encodedFile.length,
        });
        binaryFiles.push({ file, encodedFile });
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Converted file to binary.',
          originalname,
          numEncoded: binaryFiles.length,
          numFiles: files.length,
        });
        if (binaryFiles.length === files.length) {
          resolve(binaryFiles);
        }
      })
      .catch((err) => {
        logger.log({
          code: ERROR_CODES.FAILED_TO_READ_FILE,
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error compressing file.',
          err,
        });
        reject(err);
      });
  });
});

export const convertSingleToBinary = (file: Object) => new Promise<Buffer>((resolve, reject) => {
  // For each file:
  logger.log({ level: LOG_LEVELS.DEBUG, message: 'Converting file to binary', file });
  if (file.originalname.endsWith('.xlsx')) {
    file.mimetype = MIMETYPES.XLSX;
  }
  const {
    path, originalname, mimetype, encoding,
  } = file;
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Converting file to binary',
    path,
    mimetype,
    encoding,
    originalname,
  });

  compressFile(path)
    .then((fileBuffer: Buffer) => {
      logger.log({
        level: LOG_LEVELS.INFO,
        severity: STACKDRIVER_SEVERITY.INFO,
        message: 'Size of compressed file buffer',
        fileBufferLength: fileBuffer.length,
      });
      resolve(fileBuffer);
    })
    .catch((err) => {
      logger.log({
        code: ERROR_CODES.FAILED_TO_READ_FILE,
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error reading file.',
        err,
      });
      reject(err);
    });
});

/**
 * Takes a file and decodes its
 * @param {Object} file - The file object including the binaryData.
 * @returns {String} Either the path of the file if written out, or the file data itself.
 */
export const decodeFile = (file: Object) => new Promise<string>(async (resolve, reject) => {
  // If file already exists, just return that file path
  let path = Path.join(__dirname, `uploads/${file.name}`);
  const { name, binaryData } = file;
  // START HACK - A minor hack to fix .jpeg file issue
  // This is required due to a bug in `base64-img` library to only output jpg extension
  let imgFileName = name;
  if (name.indexOf('.jpeg') >= 0) {
    imgFileName = name.replace('.jpeg', '.jpg');
    path = path.replace(name, imgFileName);
  }
  // END HACK
  let { encoding } = file;

  let bufferString;
  let decodedFile;
  let htmlString;

  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY,
    message: 'Decoding file.',
    fileName: name,
    mimetype: file.mimetype,
  });

  const compressedBuffer = binaryData.buffer;
  decompressFile(compressedBuffer).then((decompressedBuffer) => {
    try {
      // eslint-disable-next-line
        switch (file.mimetype) {
        case MIMETYPES.PNG:
        case MIMETYPES.JPEG:
          bufferString = decompressedBuffer.toString('base64');
          if (file.mimetype === MIMETYPES.PNG) {
            decodedFile = `data:image/png;base64,${bufferString}`;
          } else if (file.mimetype === MIMETYPES.JPEG) {
            decodedFile = `data:image/jpeg;base64,${bufferString}`;
          }
          base64Img.img(
            decodedFile,
            Path.join(__dirname, 'uploads'),
            imgFileName.slice(0, imgFileName.length - 4),
            (err) => {
              if (err) {
                logger.log({
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Failed to write file out.',
                  err,
                });
                reject(err);
              } else {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Wrote file out',
                  path,
                });
                resolve(path);
              }
            },
          );
          break;
        case MIMETYPES.PDF:
          fs.writeFile(path, decompressedBuffer, (err) => {
            if (err) {
              logger.log({
                code: ERROR_CODES.FAILED_TO_WRITE_FILE,
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error writing decoded file.',
                err,
              });
              reject(err);
            }
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Decoded',
              path,
            });
            resolve(path);
          });
          break;
        case MIMETYPES.EMAIL:
          bufferString = decompressedBuffer.toString('base64');
          htmlString = Buffer.from(
            Buffer.from(bufferString, 'base64').toString('ascii'),
            'base64',
          ).toString('ascii');
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY,
            message: 'Decoded Email Content',
            decompressedBuffer,
            bufferString,
            htmlString,
          });
          // eslint-disable-next-line
            resolve(JSON.parse(htmlString.replace(/[\u0000-\u0019]+/g, '')));
          break;
        case MIMETYPES.HTML:
          if (encoding === '7bit') {
            encoding = 'ascii';
          }
          bufferString = decompressedBuffer.toString(encoding);
          resolve(bufferString);
          break;
        case MIMETYPES.DOC:
        case MIMETYPES.DOCX:
        case MIMETYPES.XLSX:
          fs.writeFile(path, decompressedBuffer, (err) => {
            if (err) {
              logger.log({
                code: ERROR_CODES.FAILED_TO_WRITE_FILE,
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to write out file',
                err,
              });
              reject(err);
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Wrote file out',
                path,
              });
              resolve(path);
            }
          });
          break;
        default:
          fs.writeFile(path, decompressedBuffer, (err) => {
            if (err) {
              logger.log({
                code: ERROR_CODES.FAILED_TO_WRITE_FILE,
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to write out file',
                err,
              });
              reject(err);
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Wrote file out',
                path,
              });
              resolve(path);
            }
          });
          break;
      }
    } catch (err) {
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Error decoding file',
        err,
        errMsg: err.message,
      });
      reject(err);
    }
  });
});

/**
 * Reads in a file and creates a HTML representation of that file.
 * NOTE: For PDF files, nothing is created, as modern browsers can render PDFs natively.
 * @param {string} path - The path to the file.
 * @param {Object} fileInfo - Metadata about the file needed for conversion.
 * @returns {Object} - An object containing html, and associated style information.
 */
export const convertFileToHTML = (path: string | Object, fileInfo: Object) => new Promise<any>((resolve, reject) => {
  // Create worker to build the certificate.
  const worker = new Worker(Path.join(__dirname, './workers/filePreviewWorker.js'), {
    workerData: {
      path,
      fileInfo,
    },
  });
  worker.on('message', (result) => {
    if (!result.ok) {
      reject(result.err);
    } else {
      resolve(result.preview);
    }
  });
  worker.on('error', (err) => {
    reject(
      new Error(`Worker Thread encountered an error while trying to decompress a file: ${err}`),
    );
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      reject(new Error(`Worker stopped with exit code ${code}`));
    }
  });
});

/**
 * Adds any required custom styles to a HTML preview of a document.
 * @param {*} style - Takes in any initial styles generated with the HTML preview.
 * @param {*} type - Type of file dictates extra styling.
 * @returns {Object} - A styles object to apply to the html.
 */
export const styleFilePreview = (style: Object, type: string) => new Promise<Object>((resolve) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Styling preview of type',
    type,
  });
  switch (type) {
    case 'text/plain':
      resolve({
        'font-size': '4px',
      });
      return;
    default:
      resolve({});
  }
});

/**
 * Takes in a html preview of a file, and reduces it to a smaller form.
 * @param {Object} fileHTML - The previously generated HTML version of the file.
 * @param {Object} fileType - The mimetype of the file.
 * @returns {Object} - The HTML in a reduced form.
 */
export const reduceFileToPreview = (fileHTML: Object, fileType: string) => new Promise<Object>((resolve, reject) => {
  if (
    fileType === MIMETYPES.JS
      || fileType === MIMETYPES.TEXT
      || fileType === MIMETYPES.JSON
      || fileType === MIMETYPES.OCTET_STREAM
      || fileType === MIMETYPES.SHELL
  ) {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Shortening Text Type File...',
      fileType,
      fileHTML,
    });
    fileHTML.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    fileHTML.content = fileHTML.content.substring(0, 650);
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Text file shortened.',
      fileType,
      fileHTML,
    });

    styleFilePreview(fileHTML.styles, fileType)
      .then((newStyles) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Styled File Preview!',
          fileType,
          fileHTML,
        });
        fileHTML.styles = newStyles;
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Resolving...',
          fileType,
          fileHTML,
        });
        resolve(fileHTML);
      })
      .catch((err) => {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to style preview',
          fileType,
        });
        reject(err);
      });
  } else {
    switch (fileType) {
      case MIMETYPES.PDF:
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'PDFs do not require reduction.',
          fileType,
        });
        resolve({});
        break;
      case MIMETYPES.EMAIL:
        logger.log({ level: LOG_LEVELS.DEBUG, message: 'Reducing email', fileHTML });
        resolve(fileHTML);
        break;
      default:
        resolve(fileHTML);
        break;
    }
  }
});

/**
 * Simple method for taking a file name and generating a new file name that will not cause duplication problems.
 * @TODO -> Method currently acts as a place holder which simply appends the date rather than a (1) pattern (preferred).
 * @param {string} originalFileName - The original name of the duplicate file.
 * @param {string} fileType - The file type ( for sanity checking ).
 * @returns {string} The original file name
 */
export const generateNewFileName = (originalFileName: string) => new Promise<string>((resolve) => {
  let newFileName = originalFileName;
  // First, remove the extension.
  newFileName = _.split(newFileName, '.');
  // Secondly, append the date as the unique number on the end.
  const date = Date.now();
  newFileName[0] = newFileName[0].concat(`_${date.toString()}`);
  resolve(newFileName.join('.'));
});
