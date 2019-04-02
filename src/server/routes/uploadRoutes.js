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
import rimraf from 'rimraf';
import multer from 'multer';
import uuidv4 from 'uuid/v4';
import { convertToBinary, doesUploadExceedRemainingStorage } from '../helpers/fileHelpers';
import { getUserFromEmail, getUserFromToken } from '../helpers/userHelpers';
import { convertEmailToBinary, createEmailDocument } from '../helpers/emailHelpers';
import {
  uploadFile,
  updateFile,
  createNewProof,
  checkForDuplicates,
  uploadEmail,
  uploadAttachments,
  createNewProofImmediately,
  getOrCreateStorageUsage,
  updateStorage,
} from '../helpers/mongoAPI';
import {
  sendEmailUploadFailedEmail,
  sendEmailUploadPassedEmail,
  sendEmailUploadNoAccountEmail,
} from '../helpers/sendgrid';
import { LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';
import { generalFormat } from '../modules/winston.config';

module.exports = (app: any) => {
  const upload = multer({ dest: 'uploads/', limits: { fieldSize: 25 * 1024 * 1024 } });
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
   * Upload a document to the database.
   * @param {Array<File>} files - An array of files for uploading.
   * @param {boolean} force - If true, do not check for duplicate files and upload anyway.
   * @returns {Response} 200 and an Object with uploadComplete boolean and matchingFiles Array.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.post('/api/upload/', upload.any(), (req, res) => {
    const { files } = req;
    const { force, comment } = req.body;
    const reqId = uuidv4();
    let { tags } = req.body;
    tags = tags.split(',');

    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: '[REQUEST] -> Upload files',
      force,
      reqId,
    });

    if (files.length === 0) {
      logger.log({
        level: LOG_LEVELS.INFO,
        severity: STACKDRIVER_SEVERITY.INFO,
        message: 'No documents to upload.',
        reqId,
      });
      res.status(200).send({ uploadComplete: true });
    } else {
      // First get the user for this token:
      getUserFromToken(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.INFO,
            severity: STACKDRIVER_SEVERITY.INFO,
            message: 'Request to upload documents for user',
            user,
            comment,
            tags,
            numberOfFiles: files.length,
            reqId,
          });
          // Check if any of the files exist first:
          checkForDuplicates(files, user._id, false)
            .then((matchingFiles) => {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'List of matching documents: ',
                matchingFiles,
                length: matchingFiles.length,
                force,
                reqId,
              });
              if (matchingFiles.length > 0 && force === 'false') {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Found matching files for upload:',
                  uploadComplete: false,
                  matchingFiles,
                  reqId,
                });
                res.status(200).send({ uploadComplete: false, matchingFiles });
              } else {
                // Check storage limit
                getOrCreateStorageUsage(user._id).then((storageResult) => {
                  doesUploadExceedRemainingStorage(storageResult, files).then((doesExceed) => {
                    if (doesExceed.exceed) {
                      const returnObj = {
                        level: LOG_LEVELS.INFO,
                        severity: STACKDRIVER_SEVERITY.INFO,
                        message: 'Upload would exceed storage:',
                        uploadComplete: false,
                        matchingFiles,
                        reqId,
                      };
                      logger.log(returnObj);
                      res.status(403).send(returnObj);
                    } else {
                      // Convert file to binary for putting into Mongo.
                      convertToBinary(files)
                        .then((result: Array<Object>) => {
                          uploadFile(result, files, user._id, comment, tags)
                            .then(() => {
                              updateStorage(doesExceed.newStorageUsed, doesExceed.newDocumentsUsed, user._id).then(() => {
                                try {
                                // Now clear the multer uploads directory:
                                  const uploadsDir = `${__dirname}/uploads`;
                                  logger.log({
                                    level: LOG_LEVELS.DEBUG,
                                    severity: STACKDRIVER_SEVERITY.DEBUG,
                                    message: 'Removing old uploads...',
                                    uploadsDir,
                                    reqId,
                                  });
                                  fs.readdir(uploadsDir, (err, certList) => {
                                    if (certList) {
                                      certList.forEach((cert) => {
                                        fs.stat(path.join(uploadsDir, cert), (statErr, stat) => {
                                          if (statErr) {
                                            logger.log({
                                              level: LOG_LEVELS.WARN,
                                              severity: STACKDRIVER_SEVERITY.WARNING,
                                              message: 'Failed to stat upload in uploads.',
                                              statErr,
                                              reqId,
                                            });
                                          }
                                          const now = new Date().getTime();
                                          const endTime = new Date(stat.ctime).getTime() + 3600000;
                                          if (now > endTime) {
                                            logger.log({
                                              level: LOG_LEVELS.INFO,
                                              severity: STACKDRIVER_SEVERITY.INFO,
                                              message: 'Upload is old, deleting',
                                              now,
                                              endTime,
                                              cert,
                                              reqId,
                                            });
                                            rimraf(path.join(uploadsDir, cert), (rimrafErr) => {
                                              if (rimrafErr) {
                                                logger.log({
                                                  level: LOG_LEVELS.WARN,
                                                  severity: STACKDRIVER_SEVERITY.WARNING,
                                                  message: 'Failed to rimraf upload in uploads.',
                                                  rimrafErr,
                                                  reqId,
                                                });
                                              }
                                              logger.log({
                                                level: LOG_LEVELS.INFO,
                                                severity: STACKDRIVER_SEVERITY.INFO,
                                                message: 'Removed old upload.',
                                                reqId,
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
                                    message: 'Failed to remove old uploads.',
                                    removeUploadsError,
                                    errMSg: removeUploadsError,
                                    reqId,
                                  });
                                }
                                createNewProof()
                                  .then(() => {
                                    logger.log({
                                      level: LOG_LEVELS.INFO,
                                      severity: STACKDRIVER_SEVERITY.INFO,
                                      message: 'Succeeded in uploading files',
                                      uploadComplete: true,
                                      matchingFiles,
                                      reqId,
                                    });
                                    res.status(200).send({ uploadComplete: true, matchingFiles: [] });
                                  })
                                  .catch((err) => {
                                    logger.log({
                                      level: LOG_LEVELS.ERROR,
                                      severity: STACKDRIVER_SEVERITY.ERROR,
                                      message: 'Error creating new proof:',
                                      err,
                                      errMsg: err.message,
                                      reqId,
                                    });
                                  });
                              }).catch((updateStorageErr) => {
                                const returnObj = {
                                  level: LOG_LEVELS.ERROR,
                                  severity: STACKDRIVER_SEVERITY.ERROR,
                                  message: 'Error updating storage usage:',
                                  updateStorageErr,
                                  errMsg: updateStorageErr.message,
                                  reqId,
                                };
                                logger.log(returnObj);
                                res.status(400).send(returnObj);
                              });
                            })
                            .catch((err) => {
                              logger.log({
                                level: LOG_LEVELS.ERROR,
                                severity: STACKDRIVER_SEVERITY.ERROR,
                                message: 'Error uploading file:',
                                err,
                                errMsg: err.message,
                                reqId,
                              });
                              res.status(400).send(err);
                            });
                        })
                        .catch((err) => {
                          logger.log({
                            level: LOG_LEVELS.ERROR,
                            severity: STACKDRIVER_SEVERITY.ERROR,
                            message: 'Error converting to binary:',
                            err,
                            errMsg: err.message,
                            reqId,
                          });
                          res.status(400).send(err);
                        });
                    }
                  }).catch((doesExceedErr) => {
                    const returnObj = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Error checking if files exceed storage:',
                      doesExceedErr,
                      errMsg: doesExceedErr.message,
                      reqId,
                    };
                    logger.log(returnObj);
                    res.status(400).send(returnObj);
                  });
                }).catch((getStorageErr) => {
                  const returnObj = {
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Error while checking storage:',
                    getStorageErr,
                    errMsg: getStorageErr.message,
                    reqId,
                  };
                  logger.log(returnObj);
                  res.status(400).send(returnObj);
                });
              }
            })
            .catch((checkDupesErr) => {
              const returnObj = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error while checking for duplicates:',
                checkDupesErr,
                errMsg: checkDupesErr.message,
                reqId,
              };
              logger.log(returnObj);
              res.status(400).send(returnObj);
            });
        })
        .catch((err) => {
          logger.log({
            level: LOG_LEVELS.WARN,
            severity: STACKDRIVER_SEVERITY.WARNING,
            message: 'Error finding user:',
            err,
            errMsg: err.message,
            reqId,
          });
          res.status(401).send(err);
        });
    }
  });

  /**
   * Upload a new version of a document existing in the database.
   * @param {Array<File>} files - An array of files for uploading.
   * @returns {Response} 200 and an Object with uploadComplete boolean and matchingFiles Array.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.post('/api/uploadNewVersion/', upload.any(), (req, res) => {
    const { files } = req;
    const { comment } = req.body;
    const reqId = uuidv4();
    let { tags } = req.body;
    tags = tags.split(',');

    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Upload new document versions for user',
      files,
      comment,
      tags,
      reqId,
    });

    if (files.length === 0) {
      logger.log({
        level: LOG_LEVELS.INFO,
        severity: STACKDRIVER_SEVERITY.INFO,
        message: 'No documents to update.',
        reqId,
      });
      res.status(200).send({ uploadComplete: true });
    } else {
      // First get the user for this token:
      getUserFromToken(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Found user from token',
            user,
            reqId,
          });
          getOrCreateStorageUsage(user._id).then((storageResult) => {
            doesUploadExceedRemainingStorage(storageResult, files).then((doesExceed) => {
              if (doesExceed.exceed) {
                const returnObj = {
                  level: LOG_LEVELS.INFO,
                  severity: STACKDRIVER_SEVERITY.INFO,
                  message: 'Upload would exceed storage:',
                  uploadComplete: false,
                  files,
                  reqId,
                };
                logger.log(returnObj);
                res.status(403).send(returnObj);
              } else {
                // Convert file to binary for putting into Mongo.
                convertToBinary(files)
                  .then((result) => {
                    createNewProofImmediately()
                      .then(() => {
                        updateFile(result, files, user._id, comment, tags)
                          .then(() => {
                            logger.log({
                              level: LOG_LEVELS.DEBUG,
                              severity: STACKDRIVER_SEVERITY.DEBUG,
                              message: 'Document update complete',
                              reqId,
                            });

                            updateStorage(doesExceed.newStorageUsed, doesExceed.newDocumentsUsed, user._id).then(() => {
                              // Clear temp files.
                              try {
                              // Now clear the multer uploads directory:
                                const uploadsDir = 'uploads/';
                                logger.log({
                                  level: LOG_LEVELS.DEBUG,
                                  severity: STACKDRIVER_SEVERITY.DEBUG,
                                  message: 'Removing temp uploads...',
                                  uploadsDir,
                                  reqId,
                                });
                                fs.readdir(uploadsDir, (err, tempFilesList) => {
                                  if (tempFilesList) {
                                    tempFilesList.forEach((tempFile) => {
                                      fs.stat(path.join(uploadsDir, tempFile), (statErr, stat) => {
                                        if (statErr) {
                                          logger.log({
                                            level: LOG_LEVELS.WARN,
                                            severity: STACKDRIVER_SEVERITY.WARNING,
                                            message: 'Failed to stat temp uploads folder.',
                                            statErr,
                                            reqId,
                                          });
                                        }
                                        const now = new Date().getTime();
                                        const endTime = new Date(stat.ctime).getTime() + 360000;
                                        if (now > endTime) {
                                          logger.log({
                                            level: LOG_LEVELS.INFO,
                                            severity: STACKDRIVER_SEVERITY.INFO,
                                            message: 'Temp file is old, deleting',
                                            now,
                                            endTime,
                                            tempFile,
                                            reqId,
                                          });
                                          rimraf(path.join(uploadsDir, tempFile), (rimrafErr) => {
                                            if (rimrafErr) {
                                              logger.log({
                                                level: LOG_LEVELS.WARN,
                                                severity: STACKDRIVER_SEVERITY.WARNING,
                                                message: 'Failed to rimraf temp file in uploads.',
                                                rimrafErr,
                                                errMsg: rimrafErr.message,
                                                reqId,
                                              });
                                            }
                                            logger.log({
                                              level: LOG_LEVELS.INFO,
                                              severity: STACKDRIVER_SEVERITY.INFO,
                                              message: 'Removed temp file.',
                                              reqId,
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
                                  errMsg: removeUploadsError.message,
                                  reqId,
                                });
                              }
                              createNewProof()
                                .then(() => {
                                  logger.log({
                                    level: LOG_LEVELS.INFO,
                                    severity: STACKDRIVER_SEVERITY.INFO,
                                    message: 'Success in uploading new file version',
                                    uploadComplete: true,
                                    matchingFiles: [],
                                    reqId,
                                  });
                                  res.status(200).send({ uploadComplete: true, matchingFiles: [] });
                                })
                                .catch((err) => {
                                  const returnMessage = {
                                    level: LOG_LEVELS.ERROR,
                                    severity: STACKDRIVER_SEVERITY.ERROR,
                                    message: 'Error creating new proof:',
                                    err,
                                    errMsg: err.message,
                                    reqId,
                                  };
                                  logger.log(returnMessage);
                                  res.status(400).send(returnMessage);
                                });
                            }).catch((updateStorageErr) => {
                              const returnObj = {
                                level: LOG_LEVELS.ERROR,
                                severity: STACKDRIVER_SEVERITY.ERROR,
                                message: 'Error updating storage usage:',
                                updateStorageErr,
                                errMsg: updateStorageErr.message,
                                reqId,
                              };
                              logger.log(returnObj);
                              res.status(400).send(returnObj);
                            });
                          })
                          .catch((err) => {
                            const returnMessage = {
                              level: LOG_LEVELS.ERROR,
                              severity: STACKDRIVER_SEVERITY.ERROR,
                              message: 'Error Updating File:',
                              err,
                              errMsg: err.message,
                              reqId,
                            };
                            logger.log(returnMessage);
                            res.status(400).send(returnMessage);
                          });
                      })
                      .catch((err) => {
                        const returnMessage = {
                          level: LOG_LEVELS.ERROR,
                          severity: STACKDRIVER_SEVERITY.ERROR,
                          message: 'Error submitted proof for previous version.',
                          err,
                          errMsg: err.message,
                          reqId,
                        };
                        logger.log(returnMessage);
                        res.status(400).send(returnMessage);
                      });
                  })
                  .catch((err) => {
                    const returnMessage = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Error converting to binary:',
                      err,
                      errMsg: err.message,
                      reqId,
                    };
                    logger.log(returnMessage);
                    res.status(400).send(returnMessage);
                  });
              }
            });
          });
        })
        .catch((err) => {
          const returnMessage = {
            level: LOG_LEVELS.WARN,
            severity: STACKDRIVER_SEVERITY.WARNING,
            message: 'Error finding user:',
            err,
            errMsg: err.message,
            reqId,
          };
          logger.log(returnMessage);
          res.status(401).send(returnMessage);
        });
    }
  });

  /**
   * Get a list of duplicate documents from a list of new documents to upload.
   * @param {Array<File>} files - An array of files for checking duplicate status..
   * @returns {Response} 200 and an array of duplicate files.
   * @returns {Resposne} 400 and an error if any error occurs during the process.
   */
  app.post('/api/getListOfDuplicates/', upload.any(), (req, res) => {
    const { files } = req;
    const reqId = uuidv4();
    if (files.length === 0) {
      logger.log({
        level: LOG_LEVELS.INFO,
        severity: STACKDRIVER_SEVERITY.INFO,
        message: 'No documents to check.',
        reqId,
      });
      res.status(200).send({ uploadComplete: true });
    } else {
      // First get the user for this token:
      getUserFromToken(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.INFO,
            severity: STACKDRIVER_SEVERITY.INFO,
            message: '[REQUEST] -> Check duplicates for user',
            user,
            files,
            reqId,
          });
          // Check if any of the files exist first:
          checkForDuplicates(files, user._id, false).then((matchingFiles) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'List of matching documents: ',
              matchingFiles,
              length: matchingFiles.length,
              reqId,
            });
            res.status(200).send(matchingFiles);
          });
        })
        .catch((err) => {
          const returnMessage = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error finding user:',
            err,
            errMsg: err.message,
            reqId,
          };
          logger.log(returnMessage);
          res.status(401).send(returnMessage);
        });
    }
  });

  /**
   * Upload an email into a users proven documents.
   * @param {Object} body - Email information from SendGrid, including;
   * @param {string} body.subject - The Subject of the email.
   * @param {string} body.to - The target reciepients of the email.
   * @param {string} body.cc - The target carbon copy reciepients of the email.
   * @param {string} body.sender_ip - The ip of the email sender.
   * @param {string} body.from - The sender of the email
   * @param {string} body.email - The raw email including attachments and content.
   * @returns {boolean} True or an error.
   */
  app.post('/api/uploadEmail', upload.any(), (req, res) => {
    const {
      from, to, cc, subject, headers, html,
    } = req.body;
    const attachments = req.files;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Upload an email',
      reqId,
    });
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'Email Attributes',
      html: '[REDACTED]',
      subject,
      to,
      cc,
      from,
      headers,
      reqId,
    });

    getUserFromEmail(from.split('<')[1].slice(0, -1))
      .then((getUserResult) => {
        logger.log({
          level: LOG_LEVELS.INFO,
          severity: STACKDRIVER_SEVERITY.INFO,
          message: 'Result of get user command',
          result: getUserResult,
          reqId,
        });
        getOrCreateStorageUsage(getUserResult.user_id).then((storageResult) => {
          doesUploadExceedRemainingStorage(storageResult, attachments).then((doesExceed) => {
            if (doesExceed.exceed) {
              const returnObj = {
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'Upload would exceed storage:',
                uploadComplete: false,
                attachments,
                reqId,
              };
              logger.log(returnObj);
              res.status(403).send(returnObj);
            } else {
              convertEmailToBinary({
                subject,
                to,
                from,
                cc,
                html,
                attachments,
                headers,
              })
                .then(createEmailDocument)
                .then((createEmailDocResult: Object) => {
                  createEmailDocResult.userId = getUserResult.user_id;
                  logger.log({
                    level: LOG_LEVELS.INFO,
                    severity: STACKDRIVER_SEVERITY.INFO,
                    message: 'Result of creating email document',
                    result: createEmailDocResult,
                    reqId,
                  });
                  uploadAttachments(subject, attachments, getUserResult.user_id)
                    .then((uploadAttachmentsResult) => {
                      logger.log({
                        level: LOG_LEVELS.DEBUG,
                        message: 'Finished Uploading Attachments...',
                        uploadAttachmentsResult,
                        reqId,
                      });
                      uploadEmail(createEmailDocResult, getUserResult.user_id)
                        .then(createNewProof)
                        .then((createNewProofResult) => {
                          sendEmailUploadPassedEmail(getUserResult.email, subject, attachments.length)
                            .then(() => {
                              updateStorage(doesExceed.newStorageUsed, doesExceed.newDocumentsUsed, getUserResult.user_id).then(() => {
                                res.status(200).send(createNewProofResult);
                              }).catch((updateStorageErr) => {
                                const returnObj = {
                                  level: LOG_LEVELS.ERROR,
                                  severity: STACKDRIVER_SEVERITY.ERROR,
                                  message: 'Error updating storage usage:',
                                  updateStorageErr,
                                  errMsg: updateStorageErr.message,
                                  reqId,
                                };
                                logger.log(returnObj);
                                res.status(400).send(returnObj);
                              });
                            })
                            .catch((err) => {
                              const returnObj = {
                                level: LOG_LEVELS.ERROR,
                                severity: STACKDRIVER_SEVERITY.ERROR,
                                message: 'Failed to send outbound email.',
                                err,
                                errMsg: err.message,
                                reqId,
                              };
                              logger.log(returnObj);
                              res.status(200).send(createNewProofResult);
                            });
                        })
                        .catch((uploadErr) => {
                          const returnObj = {
                            level: LOG_LEVELS.ERROR,
                            severity: STACKDRIVER_SEVERITY.ERROR,
                            message: 'Failed to upload email.',
                            uploadErr,
                            errMSg: uploadErr.message,
                            reqId,
                          };
                          logger.log(returnObj);
                          sendEmailUploadFailedEmail(getUserResult.email, subject, attachments.length)
                            .then(() => {
                              res.status(404).send(returnObj);
                            })
                            .catch((sendErr) => {
                              const returnObjEmail = {
                                level: LOG_LEVELS.WARN,
                                severity: STACKDRIVER_SEVERITY.WARNING,
                                message: 'Failed to send email.',
                                sendErr,
                                errMsg: sendErr.message,
                                reqId,
                              };
                              logger.log(returnObjEmail);
                              res.status(404).send(returnObj);
                            });
                        });
                    })
                    .catch((uploadAttachmentsError) => {
                      const returnObj = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'Failed to upload attachments.',
                        uploadAttachmentsError,

                        reqId,
                      };
                      sendEmailUploadFailedEmail(getUserResult.email, subject);
                      res.status(404).send(returnObj);
                    });
                });
            }
          });
        });
      })
      .catch((getUserErr) => {
        const returnObj = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to get user for that email address.',
          err: getUserErr,
          errMsg: getUserErr.message,
        };
        logger.log(returnObj);
        sendEmailUploadNoAccountEmail(from.split('<')[1].slice(0, -1), subject);
        res.status(404).send(returnObj);
      });
  });
};
