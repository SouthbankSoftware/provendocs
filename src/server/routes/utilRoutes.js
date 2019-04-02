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
import uuidv4 from 'uuid/v4';
import fs from 'fs';

import createArchiveForDocument from '../helpers/archiveBuilder';
import { getUserDetails } from '../helpers/userHelpers';
import {
  getHistoricalFile,
  getVersionProofForFile,
  getDocumentProofForFile,
} from '../helpers/mongoAPI';
import { LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';
import { generalFormat } from '../modules/winston.config';

const { MongoClient } = require('mongodb');

module.exports = (app: any) => {
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: process.env.PROVENDOCS_LOG_LEVEL || LOG_LEVELS.DEBUG,
        json: true,
        colorize: true,
        format: generalFormat,
      }),
    ],
  });

  /**
   * Check the status of the ProvenDB Proxy to make sure it is avaliable.
   * @returns {Response} 200 and the string "Connected to MongoDB"
   * @returns {Resposne} 500 and the error object.
   */
  app.get('/api/checkStatus', (req, res) => {
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: '[REQUEST] -> Checking status of ProvenDB connection.',
      reqId,
    });
    let sslEnabled = true;
    if (
      process.env.PROVENDOCS_SSL_ENABLED === 'false'
      || process.env.PROVENDOCS_SSL_ENABLED === false
    ) {
      sslEnabled = false;
    }
    MongoClient.connect(process.env.PROVENDOCS_URI, {
      useNewUrlParser: true,
      poolSize: 1,
      ssl: sslEnabled,
      sslValidate: false,
    })
      .then((client) => {
        if (client) {
          client.close();
          res.status(200).send(true);
        } else {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Client connected but returned null',
            reqId,
          });
          res.status(503).send(false);
        }
      })
      .catch((err) => {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to connect to ProvenDB with error:',
          reqId,
          err,
          errMsg: err.message,
        });
        res.status(503).send(false);
      });
  });

  /**
   * Create and download an archive containing proof information for a document.
   * @param {string} fileName - The name of the file requested.
   * @param {version} version - The version the file exists in.
   * @returns {Response} 200 and the .zip file.
   * @returns {Response} 400 and an erorr if any errors occcured during the process.
   */
  app.get('/api/util/getArchive/:fileName/:version', (req, res) => {
    const { fileName, version } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Create Archive for file',
      fileName,
      version,
      reqId,
    });
    // Get User
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Got user Details',
          user,
          reqId,
        });
        getHistoricalFile(fileName, user._id, version, null)
          .then((fileInfo) => {
            logger.log({
              level: LOG_LEVELS.INFO,
              severity: STACKDRIVER_SEVERITY.INFO,
              message: 'Got File Details',
              name: fileInfo,
              reqId,
            });
            getDocumentProofForFile(fileInfo[0], user._id, 'json')
              .then((documentProofs) => {
                if (documentProofs.proofs[0]) {
                  getVersionProofForFile(fileInfo[0], true, documentProofs.proofs[0].versionProofId)
                    .then((proof) => {
                      logger.log({
                        level: LOG_LEVELS.DEBUG,
                        severity: STACKDRIVER_SEVERITY.DEBUG,
                        message: 'Got Version Proof for file:',
                        proof,
                        reqId,
                      });
                      createArchiveForDocument(
                        fileInfo[0],
                        proof.proofs[0],
                        documentProofs.proofs[0],
                        user,
                      )
                        .then((archivePath) => {
                          logger.log({
                            level: LOG_LEVELS.INFO,
                            severity: STACKDRIVER_SEVERITY.INFO,
                            message: 'Created archive for file:',
                            archivePath,
                            reqId,
                          });
                          const file = fs.createReadStream(archivePath);
                          const stat = fs.statSync(archivePath);
                          const disposition = 'attachment';
                          res.setHeader('Content-Length', stat.size);
                          res.setHeader('Content-Type', 'application/zip');
                          res.setHeader(
                            'Content-Disposition',
                            `${disposition}; filename=${fileInfo[0].name}.proof.zip`,
                          );
                          file.pipe(res);
                        })
                        .catch((createArchiveErr) => {
                          const returnObj = {
                            level: LOG_LEVELS.ERROR,
                            severity: STACKDRIVER_SEVERITY.ERROR,
                            message: 'Failed to create Archive for file!',
                            file: fileInfo[0].name,
                            createArchiveErr,
                            errMsg: createArchiveErr.message,
                            reqId,
                          };
                          logger.log(returnObj);
                          res.status(404).send(returnObj);
                        });
                    })
                    .catch((getProofErr) => {
                      const returnObj = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'Failed to get version proof for file!',
                        file: fileInfo[0].name,
                        getProofErr,
                        errMsg: getProofErr.message,
                        reqId,
                      };
                      logger.log(returnObj);
                      res.status(404).send(returnObj);
                    });
                } else {
                  const returnObj = {
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'No proofs for file.',
                    file: fileInfo[0].name,
                    reqId,
                  };
                  logger.log(returnObj);
                  res.status(404).send(returnObj);
                }
              })
              .catch((getDocumentProofsErr) => {
                const returnObj = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Failed to get document proof for file!',
                  file: fileInfo[0].name,
                  getDocumentProofsErr,
                  errMsg: getDocumentProofsErr.message,
                  reqId,
                };
                logger.log(returnObj);
                res.status(404).send(returnObj);
              });
          })
          .catch((getFileErr) => {
            const returnObj = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get File infomration for file!',
              fileName,
              getFileErr,
              reqId,
            };
            logger.log(returnObj);
            res.status(404).send(returnObj);
          });
      })
      .catch((getUserErr) => {
        const returnObj = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get User:',
          fileName,
          getUserErr,
          reqId,
        };
        logger.log(returnObj);
        res.status(404).send(returnObj);
      });
  });
};
