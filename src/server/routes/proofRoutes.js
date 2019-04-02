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
import path from 'path';
import uuidv4 from 'uuid/v4';
import { convertFileToHTML, reduceFileToPreview } from '../helpers/fileHelpers';
import { getUserFromToken, getUserDetails } from '../helpers/userHelpers';
import { ERROR_CODES, LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';
import {
  getFileInformation,
  checkProofStatus,
  getVersionProofForFile,
  getDocumentProofForFile,
  getHistoricalFile,
  createNewProof,
} from '../helpers/mongoAPI';
import createPDF from '../helpers/certificateBuilder';
import { generalFormat } from '../modules/winston.config';

module.exports = (app: any) => {
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
        json: true,
        colorize: true,
        format: generalFormat,
      }),
    ],
  });

  /**
   * Fetch proof information for a particular document.
   * @param {string} fileId - The id of the file for preview.
   * @returns {Response} Headers containing the file information and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/proof/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting proof of file.',
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
        getFileInformation(fileId, user._id, false).then((fileInfo) => {
          getDocumentProofForFile(fileInfo[0], user._id)
            .then((proof) => {
              logger.log({
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'Success getting proof for file.',
                proof,
                reqId,
              });
              res.status(200).send(proof);
            })
            .catch((getDocumentProofsError) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error checking document proof status.',
                getDocumentProofsError,
                errMsg: getDocumentProofsError.message,
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
                  const proof = { proofs: [{ status: 'Pending' }] };
                  res.status(200).send(proof);
                })
                .catch((err) => {
                  logger.log({
                    code: ERROR_CODES.FAILED_TO_SUBMIT_PROOF,
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Failed to submit new proof for unproven document.',
                    err,
                    errMsg: err.message,
                    user,
                    fileName: fileInfo[0].name,
                    reqId,
                  });
                  res.status(200).send(returnObject);
                });
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user',
          err,
          errMsg: err.message,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).send(returnObject);
      });
  });

  /**
   * Get proof info for a particular version of a file (historical)
   * @param {string} fileName - The name of the file to fetch a historical proof for.
   * @param {number} version - The version at which to fetch the proof.
   * @param {"inline" | "download"} type - Whether to return an inline file or direct download.
   * @returns {Response} Headers containing the file information and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/historicalProofInfo/:fileName/:version', (req, res) => {
    const { fileName, version } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting proof information (historical) for file.',
      fileName,
      AuthToken,
      version,
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
        getHistoricalFile(fileName, user._id, version, null).then((fileInfo) => {
          getDocumentProofForFile(fileInfo[0], user._id)
            .then((documentProofs) => {
              if (documentProofs.proofs[0]) {
                getVersionProofForFile(fileInfo[0], false, documentProofs.proofs[0].versionProofId)
                  .then((proof) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'Found Proof:',
                      proof,
                      reqId,
                    });
                    res.status(200).send(proof);
                  })
                  .catch((proofErr) => {
                    const returnObject = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Failed to get proof',
                      proofErr,
                      errMsg: proofErr.message,
                      reqId,
                    };
                    logger.log(returnObject);
                    res.status(400).send(returnObject);
                  });
              } else {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'No proof found for document',
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).send(returnObject);
              }
            })
            .catch((getDocumentProofErr) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to get documentproof information',
                getDocumentProofErr,
                errMsg: getDocumentProofErr.message,
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
          message: 'Failed to get user.',
          err,
          errMsg: err.message,
          reqId,
        };
        logger.log(returnObject);
        res.status(401).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
      });
  });

  /**
   * Create a PDF Proof certificate for a particular version of a file (historical)
   * @param {string} fileName - The name of the file to fetch a historical proof for.
   * @param {number} version - The version at which to fetch the proof.
   * @param {"inline" | "download"} type - Whether to return an inline file or direct download.
   * @returns {Response} Headers containing the file information and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/historicalProof/:type/:fileName/:version', (req, res) => {
    const { fileName, version, type } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting proof certificate (historical) for file.',
      fileName,
      AuthToken,
      version,
      reqId,
    });
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getHistoricalFile(fileName, user._id, version, null).then((fileInfo) => {
          getDocumentProofForFile(fileInfo[0], user._id)
            .then((documentProof) => {
              if (documentProof.proofs[0]) {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Found Document Proof:',
                  documentProof,
                  reqId,
                });
                getVersionProofForFile(fileInfo[0], false, documentProof.proofs[0].versionProofId)
                  .then((versionProof: Object) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'Found Version Proof:',
                      versionProof,
                      reqId,
                    });
                    createPDF(versionProof, documentProof, fileInfo[0], user)
                      .then((certPath) => {
                        logger.log({
                          level: LOG_LEVELS.INFO,
                          severity: STACKDRIVER_SEVERITY.INFO,
                          message: 'Success, Generated Certificate for file:',
                          certPath,
                          fileName,
                          user,
                          reqId,
                        });
                        const file = fs.createReadStream(certPath);
                        const stat = fs.statSync(certPath);
                        let disposition = 'inline';
                        if (type === 'download') {
                          disposition = 'attachment';
                        }
                        res.setHeader('Content-Length', stat.size);
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `${disposition}; filename=proof.pdf`);
                        file.pipe(res);
                      })
                      .catch((createCertErr) => {
                        const returnObject = {
                          level: LOG_LEVELS.ERROR,
                          severity: STACKDRIVER_SEVERITY.ERROR,
                          message: 'Failed to create certificate with err:',
                          createCertErr,
                          createCertErrMsg: createCertErr.message,
                          reqId,
                        };
                        logger.log(returnObject);
                        res
                          .status(400)
                          .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                      });
                  })
                  .catch((getDocProofErr) => {
                    const returnObject = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Failed to get document proof',
                      getDocProofErr,
                      errMsg: getDocProofErr.message,
                      reqId,
                    };
                    logger.log(returnObject);
                    res
                      .status(400)
                      .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                  });
              } else {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'No proofs for file.',
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
              }
            })
            .catch((proofErr) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to get proof',
                proofErr,
                errMsg: proofErr.message,
                reqId,
              };
              logger.log(returnObject);
              res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user.',
          err,
          errMsg: err.message,
          reqId,
        };
        logger.log(returnObject);
        res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
      });
  });

  /**
   * Create a PDF Proof certificate for the latest version of a file.
   * @param {string} fileName - The name of the file to fetch a historical proof for.
   * @param {"inline" | "download"} type - Whether to return an inline file or direct download.
   * @returns {Response} Headers containing the file information and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/proofCertificate/:type/:fileId', (req, res) => {
    const { fileId, type } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting proof certificate for file.',
      fileId,
      AuthToken,
      type,
      reqId,
    });
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileInformation(fileId, user._id, false).then((fileInfo) => {
          getDocumentProofForFile(fileInfo[0], user._id)
            .then((documentProofs) => {
              if (documentProofs.proofs[0]) {
                getVersionProofForFile(fileInfo[0], false, documentProofs.proofs[0].versionProofId)
                  .then((proof) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'Found Version Proof:',
                      proof,
                      reqId,
                    });
                    getDocumentProofForFile(fileInfo[0], user._id)
                      .then((documentProof) => {
                        logger.log({
                          level: LOG_LEVELS.DEBUG,
                          severity: STACKDRIVER_SEVERITY.DEBUG,
                          message: 'Found Document Proof:',
                          documentProof,
                          reqId,
                        });
                        createPDF(proof, documentProof, fileInfo[0], user)
                          .then((certPath) => {
                            logger.log({
                              level: LOG_LEVELS.INFO,
                              severity: STACKDRIVER_SEVERITY.INFO,
                              message: 'Generated Certificate for file:',
                              certPath,
                              fileId,
                              user,
                              reqId,
                            });
                            const file = fs.createReadStream(certPath);
                            const stat = fs.statSync(certPath);
                            let disposition = 'inline';
                            if (type === 'download') {
                              disposition = 'attachment';
                            }
                            res.setHeader('Content-Length', stat.size);
                            res.setHeader('Content-Type', 'application/pdf');
                            res.setHeader(
                              'Content-Disposition',
                              `${disposition}; filename=proof.pdf`,
                            );
                            file.pipe(res);
                          })
                          .catch((createCertErr) => {
                            const returnObject = {
                              level: LOG_LEVELS.ERROR,
                              severity: STACKDRIVER_SEVERITY.ERROR,
                              message: 'Failed to create Certificate',
                              createCertErr,
                              errMsg: createCertErr.message,
                              reqId,
                            };
                            logger.log(returnObject);
                            res
                              .status(400)
                              .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                          });
                      })
                      .catch((getDocProofErr) => {
                        const returnObject = {
                          level: LOG_LEVELS.ERROR,
                          severity: STACKDRIVER_SEVERITY.ERROR,
                          message: 'Failed to get document proof',
                          getDocProofErr,
                          errMsg: getDocProofErr.message,
                          reqId,
                        };
                        logger.log(returnObject);
                        res
                          .status(400)
                          .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                      });
                  })
                  .catch((proofErr) => {
                    const returnObject = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Failed to get version proof',
                      proofErr,
                      errMsg: proofErr.message,
                      reqId,
                    };
                    logger.log(returnObject);
                    res
                      .status(400)
                      .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                  });
              } else {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'No proofs found for document.',
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
              }
            })
            .catch((getDocumentProofErr) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to get document proof',
                getDocumentProofErr,
                errMsg: getDocumentProofErr.message,
                reqId,
              };
              logger.log(returnObject);
              res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user',
          err,
          errMsg: err.message,
          reqId,
        };
        logger.log(returnObject);
        res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
      });
  });

  /**
   * Create a PDF Proof certificate preview for the latest version of a file.
   * @param {string} fileName - The name of the file to fetch a historical proof for.
   * @returns {Response} Headers containing the file information and the file.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.get('/api/proofCertificatePreview/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { AuthToken } = req.cookies;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Getting proof certificate for file.',
      fileId,
      AuthToken,
      reqId,
    });
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Found user from token:',
          userId: user._id,
          reqId,
        });
        getFileInformation(fileId, user._id, false).then((fileInfo) => {
          getDocumentProofForFile(fileInfo[0], user._id)
            .then((documentProofs) => {
              if (documentProofs.proofs[0]) {
                getVersionProofForFile(fileInfo[0], false, documentProofs.proofs[0].versionProofId)
                  .then((proof) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'Found Proof:',
                      proof,
                      reqId,
                    });
                    createPDF(proof, documentProofs, fileInfo[0], user)
                      .then((certPath) => {
                        logger.log({
                          level: LOG_LEVELS.DEBUG,
                          severity: STACKDRIVER_SEVERITY.DEBUG,
                          message: 'Generated Certificate for file:',
                          certPath,
                          fileId,
                          user,
                          reqId,
                        });

                        // Convert PDF to preview
                        convertFileToHTML(certPath, {
                          name: 'provendb_certificate.pdf',
                          mimetype: 'application/pdf',
                        })
                          .then((result) => {
                            logger.log({
                              level: LOG_LEVELS.DEBUG,
                              severity: STACKDRIVER_SEVERITY.DEBUG,
                              message: 'Converted file to HTML:',
                              fileName: fileInfo[0].name,
                              reqId,
                            });
                            reduceFileToPreview(result, fileInfo[0].mimetype)
                              .then((reducedResult: Object) => {
                                logger.log({
                                  level: LOG_LEVELS.DEBUG,
                                  severity: STACKDRIVER_SEVERITY.DEBUG,
                                  message: 'Result of file preview reduction',
                                  fileName: fileInfo[0].name,
                                  reqId,
                                });
                                checkProofStatus(fileInfo[0]._provendb_metadata.minVersion)
                                  .then((status) => {
                                    logger.log({
                                      level: LOG_LEVELS.INFO,
                                      severity: STACKDRIVER_SEVERITY.INFO,
                                      message: 'Success, returning proof certificate preview',
                                      status,
                                      reqId,
                                    });
                                    reducedResult.status = status;
                                    res.status(200).send(reducedResult);
                                  })
                                  .catch((proofStatusError) => {
                                    const returnObject = {
                                      level: LOG_LEVELS.ERROR,
                                      severity: STACKDRIVER_SEVERITY.ERROR,
                                      message: 'Error checking proof status',
                                      proofStatusError,
                                      errMsg: proofStatusError.message,
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
                                  message: 'Failed to reduce file to preview',
                                  fileName: fileInfo[0].name,
                                  err,
                                  errMsg: err.message,
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
                              message: 'Failed to convert file to HTML',
                              err,
                              errMsg: err.message,
                              reqId,
                            };
                            logger.log(returnObject);
                            res.status(400).send(returnObject);
                          });
                      })
                      .catch((createCertErr) => {
                        const returnObject = {
                          level: LOG_LEVELS.ERROR,
                          severity: STACKDRIVER_SEVERITY.ERROR,
                          message: 'Failed to create Certificate',
                          createCertErr,
                          errMsg: createCertErr.message,
                          reqId,
                        };
                        logger.log(returnObject);
                        res.status(400).send(returnObject);
                      });
                  })
                  .catch((proofErr) => {
                    const returnObject = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Failed to get proof for file',
                      proofErr,
                      errMsg: proofErr.message,
                      reqId,
                    };
                    logger.log(returnObject);
                    res.status(400).send(returnObject);
                  });
              } else {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'No proofs for file.',
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).send(returnObject);
              }
            })
            .catch((getDocumentProofsError) => {
              const returnObject = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to get document proof for file',
                getDocumentProofsError,
                errMsg: getDocumentProofsError.message,
                reqId,
              };
              logger.log(returnObject);
              res.status(400).send(returnObject);
            });
        });
      })
      .catch((err) => {
        const returnObject = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to get proof for file',
          err,
          errMsg: err.message,
          reqId,
        };
        logger.log(returnObject);
        res.status(400).send(returnObject);
      });
  });
};
