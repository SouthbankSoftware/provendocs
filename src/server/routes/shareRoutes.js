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
import Cryptr from 'cryptr';
import fs from 'fs';
import path from 'path';
import uuidv4 from 'uuid/v4';
import createArchiveForDocument from '../helpers/archiveBuilder';
import { decodeFile, convertFileToHTML } from '../helpers/fileHelpers';
import { getUserDetails } from '../helpers/userHelpers';
import {
  getSharingInfo,
  addShareLink,
  addShareEmail,
  // getSharedFile,
  getPublicFile,
  getFileInformation,
  getHistoricalFile,
  getVersionProofForFile,
  getDocumentProofForFile,
  clearSharingInfo,
} from '../helpers/mongoAPI';
import { sendSharedFileEmail, sendEmailProofCopyEmail } from '../helpers/sendgrid';
import {
  LOG_LEVELS, STACKDRIVER_SEVERITY, MIMETYPES, ENVIRONMENTS,
} from '../common/constants';
import createPDF from '../helpers/certificateBuilder';
import { generalFormat } from '../modules/winston.config';

const urlEncryptionKey = process.env.PROVENDOCS_SECRET || 'mySecretHere';
const cryptr = new Cryptr(urlEncryptionKey);
let uri = 'https://provendocs.com';
if (process.env.PROVENDOCS_ENV === ENVIRONMENTS.PROD || !process.env.PROVENDOCS_ENV) {
  uri = 'https://provendocs.com';
} else {
  uri = `https://${process.env.PROVENDOCS_ENV}.provendocs.com`;
}

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
   * Create a unique share link for the file and place that link in the database for later retrieval.
   * @param {string} fileID - The ID of the file to create a link for.
   * @param {number} version - The version the file exists in.
   * @returns {Response} 200 and the url created..
   * @returns {Response} 400 and an erorr if any errors occcured during the process.
   */
  app.get('/api/getShareStatus/:fileId/:version', (req, res) => {
    const { fileId, version } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Get sharing info for file',
      fileId,
      version,
      reqId,
    });
    // Get User
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        getSharingInfo(user._id, fileId, version)
          .then((shareInfo: Object) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Got sharing info for file.',
              fileId,
              shareInfo,
              reqId,
            });
            if (shareInfo.length === 0) {
              // No sharing information.
              res.status(200).send({ shared: false, emails: [], link: '' });
            } else {
              res.status(200).send({
                shared: true,
                emails: shareInfo[0].emails,
                link: shareInfo[0].url,
                emailLink: shareInfo[0].emailLink,
              });
            }
          })
          .catch((getShareErr) => {
            const returnObj = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get sharing info',
              fileId,
              getShareErr,
              errMsg: getShareErr.message,
              reqId,
            };
            logger.log(returnObj);
            res.status(404).send(returnObj);
          });
      })
      .catch((getUserErr) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to get user for share status.',
          fileId,
          getUserErr,
          errMsg: getUserErr.message,
          reqId,
        };
        logger.log(returnObj);
        res.status(404).send(returnObj);
      });
  });

  /**
   * Removes any sharing metadata for a file, NOTE: This will invalidate existing share links.
   * @param {string} fileId - The ID of the file to clear sharing for.
   * @param {number} version - The version of the file to remove sharing for.
   * @returns {Response} 200 if successful.
   * @returns {Response} 400 if unsuccessful.
   * @returns {Response} 401 if unable to authenticate user.
   */
  app.get('/api/clearShareStatus/:fileId/:version/:type', (req, res) => {
    const { fileId, version, type } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Clear sharing for file',
      fileId,
      version,
      type,
      reqId,
    });
    // Get User
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        clearSharingInfo(user._id, fileId, version, type)
          .then((result) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Result of clear share info',
              result,
              reqId,
            });
            res.status(200).send(true);
          })
          .catch((clearShareErr) => {
            const returnObj = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to clear sharing information for file.',
              clearShareErr,
              errMsg: clearShareErr.message,
              reqId,
            };
            logger.log(returnObj);
            res.status(401).send(returnObj);
          });
      })
      .catch((getUserDetailsErr) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to get user for share status.',
          fileId,
          getUserDetailsErr,
          errMsg: getUserDetailsErr.message,
          reqId,
        };
        logger.log(returnObj);
        res.status(401).send(returnObj);
      });
  });

  /**
   * Create a unique share link for the file and place that link in the database for later retrieval.
   * @param {string} fileID - The ID of the file to create a link for.
   * @param {number} version - The version the file exists in.
   * @returns {Response} 200 and the url created..
   * @returns {Response} 401 if unable to authenticate the user.
   * @returns {Response} 400 and an erorr if any errors occcured during the process.
   */
  app.get('/api/createShareLink/:fileId/:version', (req, res) => {
    const { fileId, version } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Create share link for file',
      fileId,
      version,
      reqId,
    });
    // Get User
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        // Generate Share Link
        const shareString = `${fileId}-${user._id}-${version}`;
        const hashedString = cryptr.encrypt(shareString);
        const shareLink = `${uri}/share/${hashedString}`;
        // Put share link in database.
        addShareLink(user, fileId, shareLink, version)
          .then((shareRes) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Added share link for file',
              fileId,
              shareRes,
              shareLink,
              reqId,
            });
            res.status(200).send(shareLink);
          })
          .catch((getShareErr) => {
            const returnObj = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get sharing info',
              fileId,
              getShareErr,
              errMsg: getShareErr.message,
              reqId,
            };
            logger.log(returnObj);
            res.status(404).send(returnObj);
          });
      })
      .catch((getUserErr) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to get user for share status.',
          fileId,
          getUserErr,
          errMsg: getUserErr.message,
          reqId,
        };
        logger.log(returnObj);
        res.status(401).send(returnObj);
      });
  });

  /**
   * Grant one or more email addresses access to view the users file.
   * @param {string} fileID - The ID of the file to create a link for.
   * @param {number} version - The version the file exists in.
   * @returns {Response} 200 and the url created..
   * @returns {Response} 401 if unable to authenticate the user.
   * @returns {Response} 400 and an erorr if any errors occcured during the process.
   */
  app.post('/api/createShareEmail/:fileId/:version', (req, res) => {
    const { fileId, version } = req.params;
    const emails = req.body;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Email share for file',
      fileId,
      version,
      emails,
      reqId,
    });
    if (!emails) {
      const returnObj = {
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Must provide at least one email to share.',
        reqId,
      };
      res.status(400).send(returnObj);
    } else {
      // Get User
      getUserDetails(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            message: 'Found user:',
            user,
            reqId,
          });
          // Generate Share Link
          // Put share emails in database.
          const shareString = `${fileId}-${user._id}-${version}`;
          const hashedString = cryptr.encrypt(shareString);
          const shareLink = `${uri}/share/${hashedString}`;
          // Add self to user.
          addShareEmail(user, fileId, emails, shareLink, version)
            .then((shareRes) => {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Added shared emails for file, sending notification email...',
                fileId,
                shareRes,
                emails,
                user,
                reqId,
              });
              getFileInformation(fileId, user._id, false, false)
                .then((fileInformation) => {
                  sendSharedFileEmail(
                    emails[0],
                    user.email,
                    user.name,
                    fileInformation[0].name,
                    shareLink,
                  )
                    .then(() => {
                      logger.log({
                        level: LOG_LEVELS.DEBUG,
                        severity: STACKDRIVER_SEVERITY.DEBUG,
                        message: 'Share notification email sent.',
                        reqId,
                      });
                      res.status(200).send(shareLink);
                    })
                    .catch((sendNotificationEmailErr) => {
                      const returnObj = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'Failed to send  notifcation email for file sharing.',
                        sendNotificationEmailErr,
                        errMsg: sendNotificationEmailErr.message,
                        reqId,
                      };
                      logger.log(returnObj);
                      res.status(400).send(returnObj);
                    });
                })
                .catch((getFileInfoErr) => {
                  const returnObj = {
                    level: LOG_LEVELS.WARN,
                    severity: STACKDRIVER_SEVERITY.WARN,
                    message: 'Failed to get file info',
                    fileId,
                    getFileInfoErr,
                    errMsg: getFileInfoErr.message,
                    reqId,
                  };
                  logger.log(returnObj);
                  res.status(404).send(returnObj);
                });
            })
            .catch((getShareErr) => {
              const returnObj = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to get sharing info',
                fileId,
                getShareErr,
                errMSg: getShareErr.message,
                reqId,
              };
              logger.log(returnObj);
              res.status(404).send(returnObj);
            });
        })
        .catch((getUserErr) => {
          const returnObj = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to get user for share status.',
            fileId,
            getUserErr,
            errMsg: getUserErr.message,
            reqId,
          };
          logger.log(returnObj);
          res.status(401).send(returnObj);
        });
    }
  });

  /**
   * Checks if the logged in user has access to the file at the given link.
   * @param {string} link - The URL passed in with the fileId and userId encoded in.
   * @returns {Response} 401 if unable to authenticate the user.
   * @returns {Response} 400 if unsuccessful in checking status or user does not have access.
   */
  app.get('/api/checkSharedAccess/:link', (req, res) => {
    let { link } = req.params;
    const reqId = uuidv4();
    const decryptedString = cryptr.decrypt(link).split('-');
    const decryptedFileId = decryptedString[0];
    const decryptedUserId = decryptedString[1];
    const decryptedVersion = decryptedString[2];

    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> to check shared access for file',
      link,
      decryptedString,
      decryptedFileId,
      decryptedUserId,
      decryptedVersion,
      reqId,
    });
    link = `${uri}/share/${link}`;
    if (!link) {
      const returnObj = {
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'No link was provided to check access for.',
        reqId,
      };
      res.status(400).send(returnObj);
    } else {
      // Get User
      getUserDetails(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            message: 'Found user from token',
            user,
            decryptedUserId,
            reqId,
          });

          if (false) {
            // eslint-disable-line
            // decryptedUserId === user._id @TODO -> Reenable condition to activate private proofs.
            getHistoricalFile(null, decryptedUserId, decryptedVersion, decryptedFileId)
              .then((fileInfo) => {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  message: 'Got historical file.',
                  name: fileInfo[0].name,
                  reqId,
                });
                getDocumentProofForFile(fileInfo[0], decryptedUserId)
                  .then((documentProofs) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      message: 'Got document proof.',
                      name: documentProofs,
                      reqId,
                    });
                    if (documentProofs.proofs[0]) {
                      getVersionProofForFile(
                        fileInfo[0],
                        false,
                        documentProofs.proofs[0].versionProofId,
                      )
                        .then((proof) => {
                          logger.log({
                            level: LOG_LEVELS.DEBUG,
                            severity: STACKDRIVER_SEVERITY.DEBUG,
                            message: 'Got historical proof.',
                            proof,
                            documentProofs,
                            reqId,
                          });
                          console.log(documentProofs);
                          res.status(200).send({
                            fileName: fileInfo[0].name,
                            fileId: fileInfo[0]._id,
                            metaData: fileInfo[0]._provendb_metadata,
                            mimetype: fileInfo[0].mimetype,
                            documentProof: documentProofs.proofs[0],
                            proofDate: proof.proofs[0].submitted,
                            size: fileInfo[0].size,
                          });
                        })
                        .catch((getProofErr) => {
                          const returnObject = {
                            level: LOG_LEVELS.ERROR,
                            severity: STACKDRIVER_SEVERITY.ERROR,
                            message: 'Could not get version proof info for file, not yet proven?',
                            getProofErr,
                            errMSg: getProofErr.message,
                            reqId,
                          };
                          logger.log(returnObject);

                          // We don't need this except for proofDate, send back without.
                          res.status(200).send({
                            fileName: fileInfo[0].name,
                            fileId: fileInfo[0]._id,
                            metaData: fileInfo[0]._provendb_metadata,
                            mimetype: fileInfo[0].mimetype,
                            documentProof: documentProofs.proofs[0],
                            size: fileInfo[0].size,
                          });
                        });
                    } else {
                      const returnObject = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'No proof for file.',
                        reqId,
                      };
                      logger.log(returnObject);
                      res.status(400).send(returnObject);
                    }
                  })
                  .catch((getDocumentProofErr) => {
                    // Either file is not publicly shared or not privately shared with this user, reject.
                    const returnObject = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Could not get document proof for file. ',
                      getDocumentProofErr,
                      errMsg: getDocumentProofErr.message,
                      reqId,
                    };
                    logger.log(returnObject);
                    res.status(400).send(returnObject);
                  });
              })
              .catch((getFileErr) => {
                // Either file is not publicly shared or not privately shared with this user, reject.
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Could not get file info for file.',
                  getFileErr: getFileErr.message,
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).send(returnObject);
              });
          } else {
            // Not the file owner, check share status.
            // getSharedFile(decryptedFileId, decryptedUserId, decryptedVersion) Old version to get public/private files.
            getPublicFile(decryptedFileId, decryptedUserId, decryptedVersion)
              .then((fileInfo) => {
                // Check if accessing private or public link.
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  message: 'Found shared file for link',
                  link,
                  file: fileInfo[0],
                  reqId,
                });
                if (
                  // Original conditions for seeing a shared file.
                  // sharedDocument.public
                  // || (sharedDocument.emails && sharedDocument.emails.includes(user.email))
                  // || sharedDocument.author === user.email
                  // @TODO -> For version 0.1 all files are public if a link is valid, remove this line to enable private files.
                  true // eslint-disable-line
                ) {
                  logger.log({
                    level: LOG_LEVELS.DEBUG,
                    message: 'Got historical file.',
                    name: fileInfo[0].name,
                    reqId,
                  });
                  getDocumentProofForFile(fileInfo[0], decryptedUserId)
                    .then((documentProofs) => {
                      logger.log({
                        level: LOG_LEVELS.DEBUG,
                        message: 'Got document proof.',
                        name: documentProofs,
                        reqId,
                      });
                      if (documentProofs.proofs[0]) {
                        getVersionProofForFile(
                          fileInfo[0],
                          false,
                          documentProofs.proofs[0].versionProofId,
                        )
                          .then((proof) => {
                            logger.log({
                              level: LOG_LEVELS.DEBUG,
                              severity: STACKDRIVER_SEVERITY.DEBUG,
                              message: 'Got historical proof.',
                              proof,
                              reqId,
                            });
                            res.status(200).send({
                              fileName: fileInfo[0].name,
                              fileId: fileInfo[0]._id,
                              metaData: fileInfo[0]._provendb_metadata,
                              mimetype: fileInfo[0].mimetype,
                              proofDate: proof.proofs[0].submitted,
                              documentProof: documentProofs.proofs[0],
                              size: fileInfo[0].size,
                            });
                          })
                          .catch((getProofErr) => {
                            const returnObject = {
                              level: LOG_LEVELS.ERROR,
                              severity: STACKDRIVER_SEVERITY.ERROR,
                              message: 'Could not get version proof info for file.',
                              getProofErr,
                              errMsg: getProofErr.message,
                              reqId,
                            };
                            logger.log(returnObject);
                            res.status(400).send(returnObject);
                          });
                      } else {
                        const returnObject = {
                          level: LOG_LEVELS.ERROR,
                          severity: STACKDRIVER_SEVERITY.ERROR,
                          message: 'No proof for file.',
                          reqId,
                        };
                        logger.log(returnObject);
                        res.status(400).send(returnObject);
                      }
                    })
                    .catch((getDocumentProofErr) => {
                      // Either file is not publicly shared or not privately shared with this user, reject.
                      const returnObject = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'Could not get document proof for file. ',
                        getDocumentProofErr,
                        errMsg: getDocumentProofErr.message,
                        reqId,
                      };
                      logger.log(returnObject);
                      res.status(400).send(returnObject);
                    });
                } else {
                  // Either file is not publicly shared or not privately shared with this user, reject.
                  const returnObject = {
                    level: LOG_LEVELS.WARN,
                    severity: STACKDRIVER_SEVERITY.WARNING,
                    message: 'User does not have permission to view this page.',
                    user,
                    link,
                    reqId,
                  };
                  res.status(400).send(returnObject);
                }
              })
              .catch((getSharedFileErr) => {
                const returnObj = {
                  level: LOG_LEVELS.WARNING,
                  severity: STACKDRIVER_SEVERITY.WARN,
                  message: 'Unable to find matching file for link:',
                  getSharedFileErr,
                  link,
                  reqId,
                };
                res.status(400).send(returnObj);
              });
          }
        })
        .catch((getUserErr) => {
          const returnObj = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to get user for share status.',
            link,
            getUserErr,
            errMSg: getUserErr.message,
            reqId,
          };
          logger.log(returnObj);
          res.status(401).send(returnObj);
        });
    }
  });

  app.get('/api/getSharedFile/:link', (req, res) => {
    let { link } = req.params;
    const reqId = uuidv4();
    // First decode the link into fileId and userId
    const decryptedString = cryptr.decrypt(link).split('-');
    const decryptedFileId = decryptedString[0];
    const decryptedUserId = decryptedString[1];
    const decryptedVersion = decryptedString[2];

    link = `${uri}/share/${link}`;
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> To get shared file from link',
      link,
      decryptedFileId,
      decryptedUserId,
      decryptedVersion,
      reqId,
    });
    if (!link) {
      const returnObj = {
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'No link was provided to get file for.',
        reqId,
      };
      res.status(400).send(returnObj);
    } else {
      // Get User
      getUserDetails(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            message: 'Found user from token',
            user,
            decryptedUserId,
            reqId,
          });

          if (decryptedUserId === user._id) {
            // Public link, share is valid, return file preview
            getHistoricalFile(null, decryptedUserId, decryptedVersion, decryptedFileId)
              .then((fileInfo) => {
                decodeFile(fileInfo[0])
                  .then((filePath) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'File Decoded: ',
                      filePath,
                      reqId,
                    });

                    if (fileInfo[0].mimetype === MIMETYPES.PDF) {
                      const file = fs.createReadStream(filePath);
                      const stat = fs.statSync(filePath);
                      const disposition = 'inline';
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
                    } else {
                      convertFileToHTML(filePath, fileInfo[0])
                        .then((result) => {
                          res.status(200).send(result);
                        })
                        .catch((err) => {
                          const returnObject = {
                            level: LOG_LEVELS.ERROR,
                            severity: STACKDRIVER_SEVERITY.ERROR,
                            message: 'Failed to convert file to HTML:',
                            err,
                            errMSg: err.message,
                            reqId,
                          };
                          logger.log(returnObject);
                          res.status(400).send(returnObject);
                        });
                    }
                  })
                  .catch((proofErr) => {
                    const returnObject = {
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Failed to decode/get file:',
                      proofErr,
                      errMsg: proofErr.message,
                      reqId,
                    };
                    logger.log(returnObject);
                    res
                      .status(400)
                      .sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
                  });
              })
              .catch((getFileInfoErr) => {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Failed to get file:',
                  err: getFileInfoErr.message,
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
              });
          } else {
            getPublicFile(decryptedFileId, decryptedUserId, decryptedVersion, true)
              .then((fileInfo) => {
                // Check if accessing private or public link.
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  message: 'Found shared file for link',
                  link,
                  file: fileInfo.name,
                });
                if (
                  // sharedDocument.public
                  // || (sharedDocument.emails && sharedDocument.emails.includes(user.email))
                  // || sharedDocument.author === user.email
                  true // eslint-disable-line
                ) {
                  // Public link, share is valid, return file preview
                  decodeFile(fileInfo[0])
                    .then((filePath) => {
                      if (fileInfo[0].mimetype === MIMETYPES.PDF) {
                        const file = fs.createReadStream(filePath);
                        const stat = fs.statSync(filePath);
                        const disposition = 'inline';
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
                      } else {
                        convertFileToHTML(filePath, fileInfo[0])
                          .then((result) => {
                            res.status(200).send(result);
                          })
                          .catch((err) => {
                            const returnObject = {
                              level: LOG_LEVELS.ERROR,
                              severity: STACKDRIVER_SEVERITY.ERROR,
                              message: 'Failed to convert file to HTML:',
                              err,
                              errMsg: err.message,
                              reqId,
                            };
                            logger.log(returnObject);
                            res.status(400).send(returnObject);
                          });
                      }
                    })
                    .catch((proofErr) => {
                      const returnObject = {
                        level: LOG_LEVELS.ERROR,
                        severity: STACKDRIVER_SEVERITY.ERROR,
                        message: 'Failed to decode/get file:',
                        proofErr,
                        errMsg: proofErr.message,
                        reqId,
                      };
                      logger.log(returnObject);
                      res
                        .status(400)
                        .sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
                    });
                } else {
                  // Either file is not publicly shared or not privately shared with this user, reject.
                  const returnObject = {
                    level: LOG_LEVELS.WARN,
                    severity: STACKDRIVER_SEVERITY.WARNING,
                    message: 'User does not have permission to view this page.',
                    user,
                    link,
                    reqId,
                  };
                  res.status(400).send(returnObject);
                }
              })
              .catch((getSharedFileErr) => {
                const returnObj = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Unable to find matching file for link:',
                  getSharedFileErr,
                  errMsg: getSharedFileErr.message,
                  reqId,
                };
                res.status(400).send(returnObj);
              });
          }
        })
        .catch((getUserErr) => {
          const returnObj = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to get user for share status.',
            link,
            getUserErr,
            errMsg: getUserErr.message,
            reqId,
          };
          logger.log(returnObj);
          res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
        });
    }
  });

  app.get('/api/getSharedPDF/:link', (req, res) => {
    let { link } = req.params;
    const reqId = uuidv4();
    // First decode the link into fileId and userId
    const decryptedString = cryptr.decrypt(link).split('-');
    const decryptedFileId = decryptedString[0];
    const decryptedUserId = decryptedString[1];
    const decryptedVersion = decryptedString[2];

    link = `${uri}/share/${link}`;
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> To get shared file from link',
      link,
      decryptedFileId,
      decryptedUserId,
      decryptedVersion,
      reqId,
    });
    if (!link) {
      const returnObj = {
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'No link was provided to get file for.',
        reqId,
      };
      res.status(400).send(returnObj);
    } else {
      // Get User
      getUserDetails(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            message: 'Found user from token',
            user,
            decryptedUserId,
            reqId,
          });
          getPublicFile(decryptedFileId, decryptedUserId, decryptedVersion, true)
            .then((fileInfo) => {
              // Check if accessing private or public link.
              logger.log({
                level: LOG_LEVELS.DEBUG,
                message: 'Found shared file for link',
                link,
                file: fileInfo.name,
              });
              // Public link, share is valid, return file preview
              decodeFile(fileInfo[0])
                .then((filePath) => {
                  if (fileInfo[0].mimetype === MIMETYPES.PDF) {
                    const file = fs.createReadStream(filePath);
                    const stat = fs.statSync(filePath);
                    const disposition = 'inline';
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
                  } else {
                    convertFileToHTML(filePath, fileInfo[0])
                      .then((result) => {
                        res.status(200).send(result);
                      })
                      .catch((err) => {
                        const returnObject = {
                          level: LOG_LEVELS.ERROR,
                          severity: STACKDRIVER_SEVERITY.ERROR,
                          message: 'Failed to convert file to HTML:',
                          err,
                          errMsg: err.message,
                          reqId,
                        };
                        logger.log(returnObject);
                        res.status(400).send(returnObject);
                      });
                  }
                })
                .catch((proofErr) => {
                  const returnObject = {
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Failed to decode/get file:',
                    proofErr,
                    errMsg: proofErr.message,
                    reqId,
                  };
                  logger.log(returnObject);
                  res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetFile.html`));
                });
              {
                // Either file is not publicly shared or not privately shared with this user, reject.
                const returnObject = {
                  level: LOG_LEVELS.WARN,
                  severity: STACKDRIVER_SEVERITY.WARNING,
                  message: 'User does not have permission to view this page.',
                  user,
                  link,
                  reqId,
                };
                res.status(400).send(returnObject);
              }
            })
            .catch((getSharedFileErr) => {
              const returnObj = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Unable to find matching file for link:',
                getSharedFileErr,
                errMsg: getSharedFileErr.message,
                reqId,
              };
              res.status(400).send(returnObj);
            });
        })
        .catch((getUserErr) => {
          const returnObj = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to get user for share status.',
            link,
            getUserErr,
            errMsg: getUserErr.message,
            reqId,
          };
          logger.log(returnObj);
          res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
        });
    }
  });

  app.get('/api/getSharedProof/:link', (req, res) => {
    let { link } = req.params;
    const reqId = uuidv4();
    const decryptedString = cryptr.decrypt(link).split('-');
    const decryptedFileId = decryptedString[0];
    const decryptedUserId = decryptedString[1];
    const decryptedVersion = decryptedString[2];
    link = `${uri}/share/${link}`;
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> To get shared proof from link',
      link,
      decryptedFileId,
      decryptedUserId,
      decryptedVersion,
      reqId,
    });
    if (!link) {
      const returnObj = {
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'No link was provided to get proof for.',
        reqId,
      };
      res.status(400).send(returnObj);
    } else {
      // Get User
      getUserDetails(req, res, app.get('jwtSecret'))
        .then((user) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            message: 'Found user from token',
            user,
            decryptedFileId,
            decryptedUserId,
            decryptedVersion,
            reqId,
          });

          if (decryptedUserId === user._id) {
            getHistoricalFile(null, decryptedUserId, decryptedVersion, decryptedFileId)
              .then((fileInfo) => {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  message: 'Got historical file.',
                  name: fileInfo[0].name,
                  reqId,
                });
                getDocumentProofForFile(fileInfo[0], decryptedUserId).then((documentProofs) => {
                  if (documentProofs.proofs[0]) {
                    getVersionProofForFile(
                      fileInfo[0],
                      false,
                      documentProofs.proofs[0].versionProofId,
                    )
                      .then((proof) => {
                        createPDF(proof, documentProofs, fileInfo[0], user)
                          .then((certPath) => {
                            logger.log({
                              level: LOG_LEVELS.INFO,
                              severity: STACKDRIVER_SEVERITY.INFO,
                              message: 'Success, Generated Certificate for file:',
                              certPath,
                              fileName: fileInfo[0].name,
                              user,
                              reqId,
                            });
                            const file = fs.createReadStream(certPath);
                            const stat = fs.statSync(certPath);
                            const disposition = 'inline';
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
                              createCertErrMsg: createCertErr.message,
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
                      message: 'No proof for file.',
                      reqId,
                    };
                    logger.log(returnObject);
                    res
                      .status(400)
                      .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                  }
                });
              })
              .catch((getFileInfoErr) => {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Failed to get file:',
                  getFileInfoErr,
                  errMsg: getFileInfoErr.message,
                  reqId,
                };
                logger.log(returnObject);
                res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
              });
          } else {
            getPublicFile(decryptedFileId, decryptedUserId, decryptedVersion, false)
              .then((fileInfo) => {
                // Check if accessing private or public link.
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  message: 'Found shared file for link',
                  link,
                  file: fileInfo[0].name,
                  reqId,
                });
                if (
                  // sharedDocument.public
                  // || (sharedDocument.emails && sharedDocument.emails.includes(user.email))
                  // || sharedDocument.author === user.email
                  true // eslint-disable-line
                ) {
                  logger.log({
                    level: LOG_LEVELS.DEBUG,
                    message: 'Got historical file for proof.',
                    name: fileInfo[0].name,
                    reqId,
                  });
                  getDocumentProofForFile(fileInfo[0], decryptedUserId).then((documentProofs) => {
                    if (documentProofs.proofs[0]) {
                      getVersionProofForFile(
                        fileInfo[0],
                        false,
                        documentProofs.proofs[0].versionProofId,
                      )
                        .then((proof) => {
                          createPDF(proof, documentProofs, fileInfo[0], user)
                            .then((certPath) => {
                              logger.log({
                                level: LOG_LEVELS.INFO,
                                severity: STACKDRIVER_SEVERITY.INFO,
                                message: 'Success, Generated Certificate for file:',
                                certPath,
                                fileName: fileInfo[0].name,
                                user,
                                reqId,
                              });
                              const file = fs.createReadStream(certPath);
                              const stat = fs.statSync(certPath);
                              const disposition = 'inline';
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
                                createCertErrMsg: createCertErr.message,
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
                            errMsg: proofErr,
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
                        message: 'No proof for file.',
                        reqId,
                      };
                      logger.log(returnObject);
                      res
                        .status(400)
                        .sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
                    }
                  });
                } else {
                  // Either file is not publicly shared or not privately shared with this user, reject.
                  const returnObject = {
                    level: LOG_LEVELS.WARN,
                    severity: STACKDRIVER_SEVERITY.WARNING,
                    message: 'User does not have permission to view this page.',
                    user,
                    link,
                    reqId,
                  };
                  res.status(400).send(returnObject);
                }
              })
              .catch((getSharedFileErr) => {
                const returnObj = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Unable to find matching file for link:',
                  getSharedFileErr,
                  errMsg: getSharedFileErr.message,
                  reqId,
                };
                logger.log(returnObj);
                res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetProof.html`));
              });
          }
        })
        .catch((getUserErr) => {
          const returnObj = {
            level: LOG_LEVELS.WARN,
            severity: STACKDRIVER_SEVERITY.WARNING,
            message: 'Failed to get user:',
            getUserErr,
            errMsg: getUserErr.message,
            reqId,
          };
          logger.log(returnObj);
          res.status(400).sendFile(path.join(`${__dirname}/../pages/failedToGetUser.html`));
        });
    }
  });

  /**
   * Send an email to a reciepient containing the archive with the document proof.
   * @param {string} fileName - The name of the proven file being sent.
   * @param {version} version - The version the file exists in.
   * @param {string} toEmail - The email address of the target reciepient.
   * @returns {Response} 200.
   * @returns {Response} 400 and an erorr if any errors occcured during the process.
   * @returns {Response} 401 and an erorr if unable to authenticate user.
   */
  app.get('/api/sendEmailProof/:fileName/:version/:toEmail', (req, res) => {
    const { fileName, version, toEmail } = req.params;
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Create share link for file',
      fileName,
      version,
      toEmail,
      reqId,
    });
    // Get User
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        // Generate Archive.
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
                          const contents = fs.readFileSync(archivePath);
                          logger.log({
                            level: LOG_LEVELS.INFO,
                            severity: STACKDRIVER_SEVERITY.INFO,
                            message: 'Read File In:',
                            base64: `${Buffer.from(contents)
                              .toString('base64')
                              .substr(0, 250)}`,
                            reqId,
                          });
                          const link = cryptr.encrypt(
                            `${fileInfo[0]._id.toString()}-${
                              user._id
                            }-${fileInfo[0]._provendb_metadata.minVersion.toString()}`,
                          );
                          sendEmailProofCopyEmail(
                            toEmail,
                            fileInfo[0].name,
                            `${Buffer.from(contents).toString('base64')}`,
                            fileName,
                            user.name,
                            user.email,
                            `https://provendocs.com/share/${link}`,
                          )
                            .then((sendEmailResult) => {
                              logger.log({
                                level: LOG_LEVELS.DEBUG,
                                severity: STACKDRIVER_SEVERITY.DEBUG,
                                message: 'Send email proof.',
                                toEmail,
                                fileName,
                                sendEmailResult,
                                reqId,
                              });
                              res.status(200).send(true);
                            })
                            .catch((sendEmailErr) => {
                              const returnObj = {
                                level: LOG_LEVELS.ERROR,
                                severity: STACKDRIVER_SEVERITY.ERROR,
                                message: 'Failed to send email proof',
                                file: fileInfo[0].name,
                                sendEmailErr,
                                errMsg: sendEmailErr.message,
                                reqId,
                              };
                              logger.log(returnObj);
                              res.status(400).send(returnObj);
                            });
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
                          res.status(400).send(returnObj);
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
                      res.status(400).send(returnObj);
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
                  res.status(400).send(returnObj);
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
                res.status(400).send(returnObj);
              });
          })
          .catch((getFileErr) => {
            const returnObj = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to get File infomration for file!',
              fileName,
              getFileErr,
              errMsg: getFileErr.message,
              reqId,
            };
            logger.log(returnObj);
            res.status(400).send(returnObj);
          });
      })
      .catch((getUserErr) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to get user for share status.',
          fileName,
          getUserErr,
          errMsg: getUserErr.message,
          reqId,
        };
        logger.log(returnObj);
        res.status(401).send(returnObj);
      });
  });
};
