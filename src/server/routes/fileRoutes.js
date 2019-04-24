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
import fs from 'fs';
import uuidv4 from 'uuid/v4';
import path from 'path';
import fetch from 'node-fetch';
import { convertFileToHTML, decodeFile, reduceFileToPreview } from '../helpers/fileHelpers';
import { getUserFromToken, getUserDetails } from '../helpers/userHelpers';
import {
  getFilesList,
  getFileInformation,
  getFileThumbnail,
  getOrCreateStorageUsage,
  getFileHistory,
  getDocumentProofForFile,
  getHistoricalFile,
  createNewProof,
  forgetFile,
  getFileVersionCount,
  updateStorage,
} from '../helpers/mongoAPI';
import {
  ERROR_CODES,
  STACKDRIVER_SEVERITY,
  LOG_LEVELS,
  MIMETYPES,
  DOMAINS,
} from '../common/constants';
import { generalFormat } from '../modules/winston.config';

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
   * Get a reduced preview of a file for rendering in the UI.
   * @param {string} fileId - The id of the file for preview.
   * @returns {Response} 200 and the html preview for non-PDF files.
   * @returns {Response} 200 and nothing for a PDF file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/filePreview/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting preview of file for user.',
      fileId,
      AuthToken,
      reqId,
    });

    const _getDocProofForFile = (fileInfo, user, resultPreview) => {
      getDocumentProofForFile(fileInfo[0], user._id)
        .then((documentProofs: Object) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Result of checking proof status:',
            documentProofs,
            reqId,
          });
          if (documentProofs.proofs[0].status) {
            resultPreview.status = documentProofs.proofs[0].status;
          } else {
            resultPreview.status = 'Pending';
          }
          res.status(200).send(resultPreview);
        })
        .catch((getDocumentProofsError) => {
          const returnObject = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error checking document proof status.',
            getDocumentProofsError,
            reqId,
          };
          logger.log(returnObject);

          createNewProof()
            .then((createNewProofResult) => {
              logger.log({
                code: 1,
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'Submitted new proof for unproven document.',
                createNewProofResult,
                user,
                fileName: fileInfo[0].name,
                reqId,
              });
              resultPreview.status = 'Pending';
              res.status(200).send(resultPreview);
            })
            .catch((err) => {
              logger.log({
                code: ERROR_CODES.FAILED_TO_SUBMIT_PROOF,
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to submit new proof for unproven document.',
                err,
                user,
                fileName: fileInfo[0].name,
                reqId,
              });
              resultPreview.status = 'Unproven';
              res.status(200).send(returnObject);
            });
        });
    };
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user.',
          userId: user._id,
          reqId,
        });
        getFileInformation(fileId, user._id, false, true)
          .then((fileInfo: Array<Object>) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'File Metadata: ',
              hasMetadata: fileInfo[0]._provendb_metadata,
              reqId,
            });
            const resultPreview = {
              content: '',
              styles: '',
              fileName: '',
              status: '',
            };
            getFileThumbnail(fileId, user._id)
              .then((result) => {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'File Thumbnail Loaded: ',
                  success: result && result.binaryData ? 'true' : 'false',
                });
                try {
                  const { binaryData } = result;
                  const base64ImgStr = binaryData.buffer.toString('base64');
                  if (base64ImgStr !== '') {
                    resultPreview.content = `data:image/jpeg;base64,${base64ImgStr}`;
                  }

                  resultPreview.fileName = fileInfo[0].name;
                } catch (ErrBinaryConv) {
                  logger.log({
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Failed to convert binary data.',
                    ErrBinaryConv,
                  });
                }
                _getDocProofForFile(fileInfo, user, resultPreview);
              })
              .catch((getThumbnailError) => {
                logger.log({
                  level: LOG_LEVELS.WARN,
                  severity: STACKDRIVER_SEVERITY.WARN,
                  message: 'Failed to get file thumbnail, requesting new thumbnail.',
                  getThumbnailError,
                });
                // Request to generate new thumbnail for this file
                fetch(
                  `${DOMAINS.THUMBS_MODULE_URL}/api/filePreview?userId=${
                    user._id
                  }&fileId=${fileId}`,
                  {
                    method: 'get',
                    headers: { 'Content-Type': 'application/json' },
                  },
                )
                  .then((result) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'File Thumbnail generation result: ',
                      result,
                      msg: result.message,
                    });
                    getFileThumbnail(fileId, user._id)
                      .then((resultAgain) => {
                        logger.log({
                          level: LOG_LEVELS.INFO,
                          severity: STACKDRIVER_SEVERITY.INFO,
                          message: 'File Thumbnail Loaded: ',
                          success: resultAgain && resultAgain.binaryData ? 'true' : 'false',
                        });
                        try {
                          const { binaryData } = resultAgain;
                          const base64ImgStr = binaryData.buffer.toString('base64');
                          if (base64ImgStr !== '') {
                            resultPreview.content = `data:image/jpeg;base64,${base64ImgStr}`;
                          }
                          resultPreview.fileName = fileInfo[0].name;
                        } catch (ErrBinaryConv) {
                          logger.log({
                            level: LOG_LEVELS.ERROR,
                            severity: STACKDRIVER_SEVERITY.ERROR,
                            message: 'Failed to convert binary data.',
                            ErrBinaryConv,
                          });
                        }
                        _getDocProofForFile(fileInfo, user, resultPreview);
                      })
                      .catch((getThumbnailErrorAgain) => {
                        logger.log({
                          level: LOG_LEVELS.WARN,
                          severity: STACKDRIVER_SEVERITY.WARNING,

                          message: 'Failed to get file thumbnail again.',
                          getThumbnailErrorAgain,
                        });
                        _getDocProofForFile(fileInfo, user, resultPreview);
                      });
                  })
                  .catch((thumbnailReqError) => {
                    logger.log({
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'File Thumbnail generation error: ',
                      thumbnailReqError,
                      msg: thumbnailReqError.message,
                    });
                    _getDocProofForFile(fileInfo, user, resultPreview);
                  });
              });
          })
          .catch((err) => {
            const returnObject = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get file information',
              err,
              reqId,
            };
            logger.log(returnObject);
            res.status(400).send(returnObject);
          });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Get a non-reduced preview of a file for rendering in the UI.
   * @param {string} fileId - The id of the file for preview.
   * @returns {Response} 200 and the html preview for non-PDF files.
   * @returns {Response} 200 and nothing for a PDF file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/fullFilePreview/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting full view of file:',
      fileId,
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileInformation(fileId, user._id, false, false).then((fileInfo) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'File Info: ',
            name: fileInfo[0].name,
            reqId,
          });
          decodeFile(fileInfo[0])
            .then((filePath) => {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'File Decoded: ',
                filePath,
                reqId,
              });
              convertFileToHTML(filePath, fileInfo[0])
                .then((result) => {
                  reduceFileToPreview(result, fileInfo[0].mimetype)
                    .then((reducedResult) => {
                      res.status(200).send(reducedResult);
                    })
                    .catch((reductionError) => {
                      const returnObject = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'Failed to reduce file:',
                        reductionError,
                        errMsg: reductionError.message,
                        reqId,
                      };
                      logger.log(returnObject);
                      res.status(400).send(returnObject);
                    });
                })
                .catch((err) => {
                  const returnObject = {
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Failed to convert file to HTML:',
                    err,
                    reqId,
                  };
                  logger.log(returnObject);
                  res.status(400).send(returnObject);
                });
            })
            .catch((err) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to decode file:',
                err,
                errMsg: err.message,
                reqId,
              };
              logger.log(returnObject);
              res.status(400).send(returnObject);
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Get the file either for download or for inline display (PDF)
   * @param {string} type - The type determines how you want the file e.g inline or download
   * @param {string} fileId - The id of the file for preview.
   * @returns {Response} 200 and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/file/:type/:fileId', (req, res) => {
    const { fileId, type } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting file:',
      fileId,
      type,
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileInformation(fileId, user._id, false, false).then((fileInfo) => {
          decodeFile(fileInfo[0])
            .then((filePath) => {
              const file = fs.createReadStream(filePath);
              const stat = fs.statSync(filePath);
              let disposition = 'inline';
              if (type === 'download') {
                disposition = 'attachment';
              }
              logger.log({
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'Success, Returning File:',
                filePath,
                fileName: fileInfo[0].name,
                disposition,
                reqId,
              });
              res.setHeader('Content-Length', stat.size);
              res.setHeader('Content-Type', fileInfo[0].mimetype);
              res.setHeader(
                'Content-Disposition',
                `${disposition}; filename="${fileInfo[0].name.toString()}"`,
              );
              file.pipe(res);
            })
            .catch((decodeFileErr) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to decode file:',
                decodeFileErr,
                reqId,
              };
              logger.log(returnObject);
              res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
      });
  });

  /**
   * Get the file as it existed at a specific version.
   * @param {string} fileName - The name of the file for preview.
   * @param {number} version - The version at which to fetch the file.
   * @returns {Response} 200 and file as it existed at that version.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/fullFileFromHistory/:fileName/:version', (req, res) => {
    const { fileName, version } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting full historical view of file:',
      fileName,
      version,
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getHistoricalFile(fileName, user._id, version, null).then((fileInfo: Array<Object>) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'File fetched at version',
            fileName: fileInfo[0].name,
            fileVersion: fileInfo[0]._provendb_metadata.minVersion,
            reqId,
          });
          decodeFile(fileInfo[0])
            .then((filePath) => {
              convertFileToHTML(filePath, fileInfo[0])
                .then((result) => {
                  logger.log({
                    level: LOG_LEVELS.INFO,
                    severity: STACKDRIVER_SEVERITY.INFO,
                    message: 'Success in getting file from history',
                    reqId,
                  });
                  res.status(200).send(result);
                })
                .catch((err) => {
                  const returnObject = {
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Failed to convert file to HTML:',
                    err,
                    reqId,
                  };
                  logger.log(returnObject);
                  res.status(400).send(returnObject);
                });
            })
            .catch((err) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to decode file:',
                err,
                reqId,
              };
              logger.log(returnObject);
              res.status(400).send(returnObject);
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Simple route to get the ID for a historical file, since fileHistory does not contain Ids.
   * @param {string} fileName - The name of the file for preview.
   * @param {number} version - The version at which to fetch the file.
   * @returns {Response} 200 and file ID if it exists.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/historicalFileId/:fileName/:version', (req, res) => {
    const { fileName, version } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting ID for historical file:',
      fileName,
      version,
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getHistoricalFile(fileName, user._id, version, null, true).then(
          (fileInfo: Array<Object>) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'File info fetched at version',
              fileName: fileInfo[0].name,
              fileVersion: fileInfo[0]._provendb_metadata.minVersion,
              reqId,
            });
            res.status(200).send(fileInfo[0]);
          },
        );
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Get the historical file either for download or for inline display (PDF)
   * @param {'email' | 'download'} type - Either inline or download.
   * @param {string} fileName - The id of the file for preview.
   * @param {number} version - The version to fetch the document at.
   * @returns {Response} 200 and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/historicalFile/:type/:fileName/:version', (req, res) => {
    const { fileName, version, type } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[ REQUEST ] -> Request to fetch historical file for user.',
      fileName,
      version,
      AuthToken,
      type,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getHistoricalFile(fileName, user._id, version, null)
          .then((fileInfo) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'File fetched at version',
              fileName: fileInfo[0].name,
              fileVersion: fileInfo[0]._provendb_metadata.minVersion,
              reqId,
            });
            decodeFile(fileInfo[0])
              .then((filePath) => {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Decoded file.',
                  filePath,
                  reqId,
                });
                if (
                  fileInfo[0].mimetype === MIMETYPES.EMAIL
                  || fileInfo[0].mimetype === MIMETYPES.HTML
                ) {
                  // Emails can be sent back directly as a JSON object for "download"
                  res.status(200).send(filePath);
                } else {
                  // Read file in and then pipe back for Download.
                  const file = fs.createReadStream(filePath);
                  const stat = fs.statSync(filePath);
                  let disposition = 'inline';
                  if (type === 'download') {
                    disposition = 'attachment';
                  }
                  logger.log({
                    level: LOG_LEVELS.INFO,
                    severity: STACKDRIVER_SEVERITY.INFO,
                    message: 'Success, Returning File:',
                    filePath,
                    fileName: fileInfo[0].name,
                    disposition,
                    reqId,
                  });
                  res.setHeader('Content-Length', stat.size);
                  res.setHeader('Content-Type', fileInfo[0].mimetype);
                  res.setHeader(
                    'Content-Disposition',
                    `${disposition}; filename="${fileInfo[0].name.toString()}"`,
                  );
                  file.pipe(res);
                }
              })
              .catch((decodeErr) => {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Failed to decode file:',
                  decodeErr,
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
              });
          })
          .catch((getHistoricalFileErr) => {
            const returnObject = {
              level: LOG_LEVELS.WARN,
              severity: STACKDRIVER_SEVERITY.WARNING,
              message: 'Failed to get historical file:',
              getHistoricalFileErr,
              reqId,
            };
            logger.log(returnObject);
            res.status(401).sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
          });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
      });
  });

  /**
   * Get the size of the files currently stored in the users collection.
   * @returns {Response} 200 and an object with the size of the files.
   * @returns {Response} 400 and an error if any error occurs during the process.
   */
  app.get('/api/filesSize', (req, res) => {
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting file sizes.',
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret')).then((user) => {
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Found user from token:',
        userId: user._id,
        reqId,
      });
      getOrCreateStorageUsage(user._id)
        .then((filesSize) => {
          logger.info({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Success in getting file sizes.',
            filesSize,
            reqId,
          });
          // New user, get email and send back for GrowSurf.
          getUserDetails(req, res, app.get('jwtSecret'))
            .then((userDetails) => {
              logger.info({
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'Success in getting file sizes and user..',
                filesSize,
                reqId,
              });
              res.status(200).send({ filesSize, email: userDetails.email });
            })
            .catch((userDetailsErr) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to get use details',
                err: userDetailsErr,
                errMsg: userDetailsErr.message,
                reqId,
              };
              logger.log(returnObject);
              res.status(404).send(returnObject);
            });
        })
        .catch((err) => {
          const returnObject = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to get file sizes:',
            mongoError: err.message,
            reqId,
          };
          logger.log(returnObject);
          res.status(401).send(returnObject);
        });
    });
  });

  /**
   * Get the number of versions of a file that exist to display in the ui.
   * @param {string} fileId - The id of the file to fetch number of versions for.
   * @returns {Response} 200 and the number of versions.
   * @returns {Response} 400 and an error if any error occurs during the process.
   */
  app.get('/api/numFileVersions/:fileId', (req, res) => {
    const { AuthToken } = req.cookies;
    const { fileId } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting number of versions for file:',
      fileId,
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileVersionCount(fileId, user._id)
          .then((result) => {
            res.status(200).send(result.length.toString());
          })
          .catch((fileVersionCountErr) => {
            const returnObject = {
              level: LOG_LEVELS.WARN,
              severity: STACKDRIVER_SEVERITY.WARNING,
              message: 'Failed to get number of versions:',
              fileVersionCountErr,
              msg: fileVersionCountErr.message,
              reqId,
            };
            logger.log(returnObject);
            res.status(400).send(returnObject);
          });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Get the history of a file with all it's versions.
   * @param {string} fileName - The name of the file to fetch history for.
   * @returns {Response} 200 and an object containing the array of document versions plus metadata.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/fileHistory/:fileName', (req, res) => {
    const { AuthToken } = req.cookies;
    const { fileName, type } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting history for file:',
      fileName,
      AuthToken,
      type,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileHistory(fileName, user._id)
          .then((fileHistory) => {
            logger.log({
              level: LOG_LEVELS.INFO,
              severity: STACKDRIVER_SEVERITY.INFO,
              message: 'Success in getting file history',
              fileName,
              userID: user._id,
              versionsFound: fileHistory.docHistory.history.versions.length,
              reqId,
            });
            res.status(200).send(fileHistory);
          })
          .catch((err) => {
            const returnObject = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get file history',
              err,
              fileName,
              reqId,
            };
            logger.log(returnObject);
            res.status(400).send(returnObject);
          });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Fetch all uploaded files (current version only) for a user.
   * @returns {Response} 200 and an object containing the array of documents uploaded.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/fileList', (req, res) => {
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting file list for user:',
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFilesList(user._id)
          .then((result) => {
            logger.log({
              level: LOG_LEVELS.INFO,
              severity: STACKDRIVER_SEVERITY.INFO,
              message: 'Success, Got file list',
              reqId,
              result,
            });
            res.status(200).send(result);
          })
          .catch((err) => {
            const returnObject = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get docs list.',
              err,
              errMessage: err.message,
              reqId,
            };
            logger.log(returnObject);
            res.status(400).send(returnObject);
          });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          errMsg: err.message,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Forget a single file.
   * @param {string} fileId - The ID of the file to be forgotten.
   * @returns {Response} 200 and an object containing an array of the documents uploaded.
   * @returns {Response} 400 and an error if a general error occurs during the process.
   * @returns {Response} 401 and an error if an authentication error occurs.
   */
  app.get('/api/forgetFile/:fileId', (req, res) => {
    const { AuthToken } = req.cookies;
    const { fileId } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting file list for user:',
      AuthToken,
      reqId,
    });
    getUserFromToken(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileInformation(fileId, user._id, false, true)
          .then((getFileResult) => {
            getOrCreateStorageUsage(user._id)
              .then((storageResult) => {
                forgetFile(fileId, user._id)
                  .then((result) => {
                    logger.log({
                      level: LOG_LEVELS.INFO,
                      severity: STACKDRIVER_SEVERITY.INFO,
                      message: 'Storage Result',
                      storageResult,
                      getFileResult,
                      newSize: storageResult[0].storageUsed - getFileResult[0].size,
                      newDocs: storageResult[0].documentsUsed - 1,
                    });

                    updateStorage(
                      storageResult[0].storageUsed - getFileResult[0].size,
                      storageResult[0].documentsUsed - 1,
                      user._id,
                    )
                      .then(() => {
                        res.status(200).send(result);
                      })
                      .catch((updateStorageErr) => {
                        const returnObject = {
                          level: LOG_LEVELS.WARN,
                          severity: STACKDRIVER_SEVERITY.WARNING,
                          message: 'Failed to forget file.',
                          updateStorageErr,
                          reqId,
                        };
                        logger.log(returnObject);
                        res.status(400).send(returnObject);
                      });
                  })
                  .catch((err) => {
                    const returnObject = {
                      level: LOG_LEVELS.WARN,
                      severity: STACKDRIVER_SEVERITY.WARNING,
                      message: 'Failed to forget file.',
                      err,
                      reqId,
                    };
                    logger.log(returnObject);
                    res.status(400).send(returnObject);
                  });
              })
              .catch((getStorageErr) => {
                const returnObject = {
                  level: LOG_LEVELS.WARN,
                  severity: STACKDRIVER_SEVERITY.WARNING,
                  message: 'Failed to get storage info.',
                  getStorageErr,
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).send(returnObject);
              });
          })
          .catch((getFileErr) => {
            const returnObject = {
              level: LOG_LEVELS.WARN,
              severity: STACKDRIVER_SEVERITY.WARNING,
              message: 'Failed to get file info.',
              getFileErr,
              reqId,
            };
            logger.log(returnObject);
            res.status(400).send(returnObject);
          });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user:',
          err,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });
};
