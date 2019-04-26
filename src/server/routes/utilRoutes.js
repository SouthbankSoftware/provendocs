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
import { deleteUser, getUserDetails, getUserFromEmail } from '../helpers/userHelpers';
import {
  getHistoricalFile,
  getVersionProofForFile,
  getDocumentProofForFile,
  forgetAllFilesForUser,
  clearStorageForUser,
  setStorageForUser,
  getIsReferralRequired,
} from '../helpers/mongoAPI';
import validateSignature from '../helpers/growsurfHelpers';
import {
  LOG_LEVELS,
  STACKDRIVER_SEVERITY,
  REFERRAL_EVENTS,
  STORAGE_LIMITS,
} from '../common/constants';
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
              // $FlowFixMe
              name: fileInfo.name,
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
                            `${disposition}; filename="${fileInfo[0].name}.proof.zip"`,
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
                          /* res
                            .status(400)
                            .sendFile(path.join(`${__dirname}/../pages/failedToGetArchive.html`)); */
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

  /**
   * Clear a users Thumbnails, forget all their files and wipe their storage usage.
   */
  app.get('/api/util/deleteAccount/', (req, res) => {
    const reqId = uuidv4();
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Delete account.',
      reqId,
    });

    getUserDetails(req, res, app.get('jwtSecret'))
      .then((user) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Got user Details',
          user,
          reqId,
        });
        forgetAllFilesForUser(user._id)
          .then(() => {
            logger.log({
              level: LOG_LEVELS.INFO,
              severity: STACKDRIVER_SEVERITY.INFO,
              message: 'User Files Forgotten',
              reqId,
            });
            clearStorageForUser(user._id)
              .then(() => {
                logger.log({
                  level: LOG_LEVELS.INFO,
                  severity: STACKDRIVER_SEVERITY.INFO,
                  message: 'User Storage Deleted',
                  reqId,
                });

                const { AuthToken } = req.cookies;
                deleteUser({ id: user._id }, AuthToken)
                  .then((response) => {
                    logger.log({
                      level: LOG_LEVELS.INFO,
                      severity: STACKDRIVER_SEVERITY.INFO,
                      message: 'User Deleted',
                      reqId,
                      response,
                    });
                    res.cookie('AuthToken', '', {
                      expires: new Date(),
                      httpOnly: true,
                    });
                    res.cookie('RefreshToken', '', {
                      expires: new Date(),
                      httpOnly: true,
                    });
                    res.status(200).send(true);
                  })
                  .catch((usrDelError) => {
                    logger.log({
                      level: LOG_LEVELS.INFO,
                      severity: STACKDRIVER_SEVERITY.INFO,
                      message: 'Failed to delete user.',
                      usrDelError,
                      errMSg: usrDelError.message,
                      reqId,
                    });
                    res.status(400).send(usrDelError.message);
                  });
              })
              .catch((clearStorageErr) => {
                logger.log({
                  level: LOG_LEVELS.INFO,
                  severity: STACKDRIVER_SEVERITY.INFO,
                  message: 'Failed to delete storage for user.',
                  clearStorageErr,
                  errMSg: clearStorageErr.message,
                  reqId,
                });
                res.status(400).send({ ok: 0, error: 'Failed to delete storage for user.' });
              });
          })
          .catch((deleteUserErr) => {
            logger.log({
              level: LOG_LEVELS.INFO,
              severity: STACKDRIVER_SEVERITY.INFO,
              message: 'Failed to delete user.',
              deleteUserErr,
              errMSg: deleteUserErr.message,
              reqId,
            });
            res.status(400).send({ ok: 0, error: 'Failed to delete user.' });
          });
      })
      .catch((getUserErr) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Failed to get user details',
          getUserErr,
          errMsg: getUserErr.message,
          reqId,
        });
        res.status(400).send({ ok: 0, error: 'Failed to find user for token.' });
      });
  });

  /**
   * WebHook for when a new referral event is triggered from GrowSurf.
   */
  app.post('/api/util/referralEvent', (req, res) => {
    const reqId = uuidv4();
    const { body } = req;
    const signature = req.get('GrowSurf-Signature');

    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[WEBHOOK] -> New referral Event Triggered',
      reqId,
      body: req.body,
      header: req.headers,
    });
    try {
      // Validate the signature
      validateSignature(body, signature);
      switch (body.event) {
        case REFERRAL_EVENTS.CAMPAIGN_ENDED:
          logger.log({
            level: LOG_LEVELS.WARN,
            severity: STACKDRIVER_SEVERITY.WARNING,
            message: 'Referral campaign has ended.',
            reqId,
            body,
          });
          res.status(200).send(true);
          break;
        case REFERRAL_EVENTS.NEW_PARTICIPANT_ADDED:
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'New participant added to referral campaign.',
            reqId,
            body,
          });
          res.status(200).send(true);
          break;
        case REFERRAL_EVENTS.PARTICIPANT_REACHED_A_GOAL:
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Referrel participant reached a goal:',
            reqId,
            body,
          });
          const { data } = body;
          const { participant, reward } = data;
          if (participant.referralCount <= reward.limit) {
            // 1gb + 500gb for each additional participant up to 5.
            const newDataLimit = STORAGE_LIMITS.DEFAULT_SIZE + 500000000 * participant.referralCount;
            const newDocsLimit = STORAGE_LIMITS.DEFAULT_DOCUMENTS + 20 * participant.referralCount;

            getUserFromEmail(participant.email)
              .then((userDetails) => {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Got user details for referrel award.',
                  reqId,
                  userDetails,
                });
                setStorageForUser(userDetails.user_id, newDataLimit, newDocsLimit)
                  .then((setStorageResult) => {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'Participant has recieved referral award.',
                      reqId,
                      participant,
                      setStorageResult,
                    });
                    res.status(200).send(true);
                  })
                  .catch((setStorageErr) => {
                    logger.log({
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Failed to reward user for referral.',
                      reqId,
                      setStorageErr,
                      errMsg: setStorageErr.message,
                    });
                    res.status(400).end();
                  });
              })
              .catch((getUserDetailsErr) => {
                logger.log({
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Failed to get user details for referrel.',
                  reqId,
                  getUserDetailsErr,
                  errMsg: getUserDetailsErr.message,
                });
                res.status(400).end();
              });
          } else {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Participant has already reached goal limit.',
              reqId,
              participant,
            });
            res.status(200).send(true);
          }

          break;
        default:
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Unrecognised Growsurf Event',
            reqId,
            body,
          });
          res.status(200).send(true);
          break;
      }
    } catch (err) {
      logger.log({
        level: LOG_LEVELS.WARN,
        severity: STACKDRIVER_SEVERITY.WARNING,
        message: 'Growsurf Referral event failed validation.',
        reqId,
        err,
      });
      res.status(400).end();
    }
  });

  app.get('/api/util/isReferralRequired', (req, res) => {
    getIsReferralRequired().then((result) => {
      res.status(200).send(result);
    });
  });
};
