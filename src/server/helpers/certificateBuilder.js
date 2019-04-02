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
import Path from 'path';
import rimraf from 'rimraf';
import winston from 'winston';
import { LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';
import { certificateAPIFormat } from '../modules/winston.config';

// $FlowFixMe
const { Worker } = require('worker_threads'); // eslint-disable-line

let uri = 'https://provendocs.com';
if (process.env.PROVENDOCS_ENV === 'TEST') {
  uri = 'https://provendocs-test.com';
} else if (process.env.PROVENDOCS_ENV === 'DEV') {
  uri = 'localhost:3000';
}
const urlEncryptionKey = process.env.PROVENDOCS_SECRET || 'mySecretHere';
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
      json: true,
      colorize: true,
      format: certificateAPIFormat,
    }),
  ],
});

/**
 * Create a new PDF Proof Certificate for a file.
 * @param {*} proof - The proof JSON object containing information about the proof.
 * @param {*} file - The file JSON object containing information about the document.
 * @param {*} user - The user JSON object containing information about the owner of the document.
 * @returns A Promise resolving the file path for the PDF.
 */
const createPDF = (proof: Object, documentProof: Object, file: Object, user: Object) => new Promise<string>((resolve, reject) => {
  try {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'Creating PDF for proof',
      file: file.name,
      user,
      proof,
      documentProof,
    });
    const singleProof = proof.proofs[0];
    const docProof = documentProof.proofs[0];
    singleProof.documentProof = docProof;

    // Clear old certificates.
    try {
      // Now clear the multer uploads directory:
      const uploadsDir = `${__dirname}/certificates`;
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Removing old certificates...',
        uploadsDir,
      });
      fs.readdir(uploadsDir, (err, certList) => {
        if (certList) {
          certList.forEach((cert) => {
            fs.stat(Path.join(uploadsDir, cert), (statErr, stat) => {
              if (statErr) {
                logger.log({
                  level: LOG_LEVELS.WARN,
                  severity: STACKDRIVER_SEVERITY.WARNING,
                  message: 'Failed to stat cert in uploads.',
                  statErr,
                });
              }
              const now = new Date().getTime();
              const endTime = new Date(stat.ctime).getTime() + 3600000;
              if (now > endTime) {
                logger.log({
                  level: LOG_LEVELS.INFO,
                  severity: STACKDRIVER_SEVERITY.INFO,
                  message: 'Certificate is old, deleting',
                  now,
                  endTime,
                  cert,
                });
                rimraf(Path.join(uploadsDir, cert), (rimrafErr) => {
                  if (rimrafErr) {
                    logger.log({
                      level: LOG_LEVELS.WARN,
                      severity: STACKDRIVER_SEVERITY.WARNING,
                      message: 'Failed to rimraf cert in uploads.',
                      rimrafErr,
                    });
                  }
                  logger.log({
                    level: LOG_LEVELS.INFO,
                    severity: STACKDRIVER_SEVERITY.INFO,
                    message: 'Removed old cert.',
                  });
                });
              }
            });
          });
        }
      });
    } catch (removeUploadsError) {
      logger.log({
        level: LOG_LEVELS.WARN,
        severity: STACKDRIVER_SEVERITY.WARNING,
        message: 'Failed to remove old certs.',
        removeUploadsError,
      });
    }

    try {
      // Determine path relative to this file.
      const path = Path.join(__dirname, `certificates/proof_certificate_${file._id}.pdf`);
      // Create worker to build the certificate.
      const worker = new Worker(Path.join(__dirname, './workers/createCertificateWorker.js'), {
        workerData: {
          uri,
          urlEncryptionKey,
          file: {
            _id: file._id.toString(),
            uploadedAt: file.uploadedAt,
            name: file.name,
            _provendb_metadata: {
              minVersion: file._provendb_metadata.minVersion.toString(),
              hash: file._provendb_metadata.hash.toString(),
            },
          },
          user,
          proof: singleProof,
          path,
          binaryProof:
              (singleProof.documentProof.proof
                && singleProof.documentProof.proof.toString('base64'))
              || 'Proof still in progress...',
        },
      });
      worker.on('message', (result) => {
        if (!result.ok) {
          reject(result.err);
        } else {
          resolve(path);
        }
      });
      worker.on('error', (err) => {
        reject(
          new Error(
            `Worker Thread encountered an error while trying to decompress a file: ${err}`,
          ),
        );
      });
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    } catch (err) {
      reject(err);
    }
  } catch (e) {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error caught while creating PDF.',
      file: file.name,
      user,
      e,
    });
    reject(e);
  }
});

export default createPDF;
