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

import _ from 'lodash';
import winston from 'winston';
import sizeOf from 'object-sizeof';
import {
  LOG_LEVELS, STACKDRIVER_SEVERITY, COLLECTION_NAMES, STORAGE_LIMITS,
} from '../common/constants';
import { mongoAPIFormat } from '../modules/winston.config';
import { generateNewFileName, convertSingleToBinary } from './fileHelpers';

const { MongoClient } = require('mongodb');
const mongo = require('mongodb');

const { Binary } = mongo;

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
      json: true,
      colorize: true,
      format: mongoAPIFormat,
    }),
  ],
});

// $FlowFixMe
const splitURI = process.env.PROVENDOCS_URI.split('/');
let provendocsDB = splitURI[splitURI.length - 1] || 'provendocs';
if (provendocsDB.match(/\?/)) {
  // eslint-disable-next-line
  provendocsDB = provendocsDB.split('?')[0];
}
let dbObject;
let sslEnabled = true;
if (
  process.env.PROVENDOCS_SSL_ENABLED === 'false'
  || process.env.PROVENDOCS_SSL_ENABLED === false
) {
  sslEnabled = false;
}

const connectToProvenDB = () => new Promise((resolve, reject) => {
  MongoClient.connect(process.env.PROVENDOCS_URI, {
    useNewUrlParser: true,
    ssl: sslEnabled,
    sslValidate: false,
    socketOptions: {
      keepAlive: 30000,
      connectTimeoutMS: 30000,
      reconnectTries: 1000,
      reconnectInterval: 1000,
    },
  })
    .then((client) => {
      dbObject = client.db(provendocsDB);
      resolve();
    })
    .catch((error) => {
      reject(error);
    });
});

connectToProvenDB()
  .then(() => {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'Connected to ProvenDB',
    });
  })
  .catch((err) => {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error connecting to ProvenDB for MongoClient.',
      err,
    });
  });

/**
 * Debounced function to ensure we only submit a proof every 5 minutes.
 * The function will be triggered on the first submitProof, and the last (trailing and leading).
 */
const debouncedSubmitProof = _.debounce(
  () => {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Started Debounced function...',
    });
    if (!dbObject) {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.CRITICAL,
        message: 'No Database Object -> Connection to ProvenDB failed!',
      });
    }
    dbObject.command({ getVersion: 1 }, (error, res) => {
      if (error || !res || res.ok !== 1) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to submitProof with error:',
          error,
        });
      } else {
        const { version } = res;
        const command = { submitProof: version, proofType: 'full' };
        dbObject.command(command, {}, (commandError, commandRes) => {
          if (commandError) {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to submitProof with error:',
              commandError,
            });
          } else {
            logger.log({
              level: LOG_LEVELS.INFO,
              severity: STACKDRIVER_SEVERITY.INFO,
              message: 'Submitted Proof!',
              commandRes,
            });
          }
        });
      }
    });
  },
  process.env.PROVENDOCS_PROOF_DEBOUNCE || 300000,
  {
    leading: true,
    trailing: true,
  },
);

const submitProof = () => new Promise<boolean>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Started Debounced function...',
  });
  if (!dbObject) {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.CRITICAL,
      message: 'No Database Object -> Connection to ProvenDB failed!',
    });
  }
  dbObject.command({ getVersion: 1 }, (error, res) => {
    if (error || !res || res.ok !== 1) {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Failed to submitProof with error:',
        error,
      });
    } else {
      const { version } = res;
      const command = { submitProof: version, proofType: 'full' };
      dbObject.command(command, {}, (commandError, commandRes) => {
        if (commandError) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to submitProof with error:',
            commandError,
          });
          reject(commandError);
        } else {
          logger.log({
            level: LOG_LEVELS.INFO,
            severity: STACKDRIVER_SEVERITY.INFO,
            message: 'Submitted Proof!',
            commandRes,
          });
          resolve(commandRes);
        }
      });
    }
  });
});

export const updateStorage = (newStorageUsed: number, newDocumentsUsed: number, userId: string) => new Promise<boolean>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject && dbObject.serverConfig && dbObject.serverConfig.isConnected(),
  });
  // If the connection to ProvenDB has failed for some reason, try to reconnect it before failing.
  if (!(dbObject && dbObject.serverConfig && dbObject.serverConfig.isConnected())) {
    // Not connected, try reconnect.
    connectToProvenDB()
      .then(() => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Reconnected to ProvenDB:',
          isConnected: dbObject.serverConfig.isConnected(),
        });
      })
      .catch((err) => {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to reconnect to ProvenDB on second try.',
          err,
        });
        reject(err);
          return; //eslint-disable-line
      });
  }
  const collection = dbObject.collection(COLLECTION_NAMES.USER_INFO);
  const filter = { _id: userId };
  const update = {
    $set: {
      documentsUsed: newDocumentsUsed,
      storageUsed: newStorageUsed,
    },
  };
  if (collection) {
    collection.updateOne(filter, update, (error, count, status) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error updating documents.',
          error,
        });
        reject(error);
      } else {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Documents updated',
          count,
          status,
        });
        resolve(true);
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

export const showMetadata = () => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });

  dbObject.command({ showMetadata: true }, (showMDErr, res) => {
    if (showMDErr || !res || res.ok !== 1) {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error showing metadata',
        showMDErr,
      });
      reject(showMDErr);
    } else {
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Show metadata result',
        res,
      });
      resolve(res);
    }
  });
});

/**
 * Check if there are duplicate files for any file in the given list.
 * @param {*} files - Array of files to determine if duplicates exist for.
 * @param {*} userId  - The ID of the user whom the files belong to.
 * @param {*} nameOnly - Whether the files array only contains file names.
 * @returns {Array<Object>} - An array of documents matching the duplicate query.
 */
export const checkForDuplicates = (files: Array<Object>, userId: string, nameOnly: boolean) => new Promise<Array<Object>>((resolve, reject) => {
  const collection = dbObject.collection(`files_${userId}`);
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Finding duplicates for files: ',
    files,
  });
  // Extract document names into a query.
  const fileNameArray = [];
  for (let file = 0; file < files.length; file += 1) {
    if (nameOnly) {
      fileNameArray.push({ name: files[file] });
    } else {
      fileNameArray.push({ name: files[file].originalname });
    }
  }

  const queryFilter = { $or: fileNameArray };
  const projectionFilter = { name: 1 };
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'File duplicate query: ',
    queryFilter,
    projectionFilter,
  });
  if (collection) {
    collection
      .find(queryFilter, { promoteLongs: false })
      .project(projectionFilter)
      .toArray((queryError, result) => {
        if (queryError) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error finding documents size',
            mongoError: queryError.message,
          });
          reject(queryError);
        } else if (result !== []) {
          resolve(result);
        } else {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'No files for size. ',
            result,
          });
          resolve([]);
        }
      });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Takes in an array of files along with the binary data and concatanates them into a single list.
 * Also double checks to make sure no duplicate files.
 * If a file is found with a duplicate name, generates a new name.
 * @TODO -> Update the name generation logic to be better.
 *
 * @param {Array<string>} binaryData - An array containing the binary format of each file uploaded.
 * @param {Array<Object>} files - An array of objects containing file information such as name.
 * @param {string} userId - The ID of the user who owns the files.
 * @param {boolean} isUpdate - Flag determining if this is an update operation. (Default: FALSE)
 * @param {string} comment - Any specified comment for this upload entered by the user. (Default: '')
 * @param {Array<string>} tags - An array of any tags specified for this upload by the user. (Default: [])
 * @returns {Array<Object>} - Returns an array of files with their metadata for inserting into MongoDB.
 */
export const concatDocs = (
  binaryData: Array<Object>,
  files: Array<Object>,
  userId: string,
  isUpdate: boolean,
  comment: string,
  tags: Array<string>,
) => new Promise<Array<Object>>((resolve, reject) => {
  const documentArray = [];
  _.forEach(binaryData, (pair) => {
    const { file, encodedFile } = pair;
    const newDocument = {
      name: file.originalname,
      encoding: file.encoding,
      size: file.size,
      mimetype: file.mimetype,
      userId,
      uploadedAt: new Date(Date.now()).toISOString(),
      comment,
      tags,
      binaryData: Binary(encodedFile),
    };
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Concat Docs Size Info:',
      sizeOfBinaryData: sizeOf(newDocument.binaryData),
      sizeOfJustMetadata: sizeOf(newDocument),
    });

    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Concat Docs Final Size:',
      finalSize: sizeOf(),
    });
    const queryFilter = { name: newDocument.name };
    const projectionFilter = { name: newDocument.name };
    const collection = dbObject.collection(`files_${userId}`);

    // Check if document name is already taken.
    if (collection) {
      collection
        .find(queryFilter, { promoteLongs: false })
        .project(projectionFilter)
        .toArray((queryError, result) => {
          if (queryError) {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Error finding documents size',
              mongoError: queryError.message,
            });
            reject(queryError);
          } else if (result.length !== 0) {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Found matching document for file:',
              fileName: newDocument.name,
              result,
              length: result.length,
            });
            if (isUpdate) {
              // If update, simply push document as is.
              documentArray.push(newDocument);
              if (documentArray.length === binaryData.length) {
                resolve(documentArray);
              }
            } else {
              // Found some documents with matching names.
              generateNewFileName(newDocument.name)
                .then((newName) => {
                  logger.log({
                    level: LOG_LEVELS.DEBUG,
                    severity: STACKDRIVER_SEVERITY.DEBUG,
                    message: 'Generated new name for file',
                    original: newDocument.name,
                    generated: newName,
                  });
                  newDocument.name = newName;
                  documentArray.push(newDocument);
                  if (documentArray.length === binaryData.length) {
                    resolve(documentArray);
                  }
                })
                .catch((err) => {
                  reject(err);
                });
            }
          } else {
            // Found no documents with matching names.
            documentArray.push(newDocument);
            if (documentArray.length === binaryData.length) {
              resolve(documentArray);
            }
          }
        });
    } else {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error getting collection',
      });
      reject(new Error({ message: 'Error getting collection!' }));
    }
  });
});

/**
 * Uploads one or more files into MongoDB.
 * @param {Array<string>} binaryData - An array containing the binary format of each file uploaded.
 * @param {Array<Object>} files - An array of objects containing file information such as name.
 * @param {string} userId - The ID of the user who owns the files.
 * @param {boolean} isUpdate - Flag determining if this is an update operation. (Default: FALSE)
 * @param {string} comment - Any specified comment for this upload entered by the user. (Default: '')
 * @param {Array<string>} tags - An array of any tags specified for this upload by the user. (Default: [])
 * @returns {boolean | Error} - Returns either true, or an error if there is a failure.
 */
export const uploadFile = (
  binaryData: Array<Object>,
  files: Array<Object>,
  userId: string,
  comment: string,
  tags: Array<string>,
) => new Promise<boolean>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Merging docs to put into ProvenDB.',
    numFiles: files.length,
  });
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(`files_${userId}`);
  if (collection) {
    // For each file, add the document.
    concatDocs(binaryData, files, userId, false, comment, tags)
      .then((documentArray) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Running insertMany into ProvenDB.',
          numDocuments: documentArray.length,
          comment,
          tags: tags.toString(),
        });
        try {
          collection.insertMany(documentArray, (insertError) => {
            if (insertError) {
              reject(insertError.message);
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Documents inserted into ProvenDB.',
              });
              resolve(true);
            }
          });
        } catch (mongoCommandErr) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to merge docs.',
            mongoErr: mongoCommandErr,
          });
          reject(mongoCommandErr);
        }
      })
      .catch((error) => {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to merge docs.',
          error,
        });
        reject(error);
      });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Upload an email into a users provendocs account.
 * @param {*} emailData - An object containing the email information for upload.
 * @param {*} userId - The ID of the user for the email to be uploaded for.
 * @returns - Resolves true, or an error.
 */
export const uploadEmail = (emailData: Object, userId: string) => new Promise<boolean>((resolve, reject) => {
  const collection = dbObject.collection(`files_${userId}`);
  logger.log({
    severity: STACKDRIVER_SEVERITY.DEBUG,
    level: LOG_LEVELS.DEBUG,
    message: 'Uploading email...',
    emailData,
  });
  if (collection) {
    collection.insertOne(emailData, (insertError) => {
      if (insertError) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error inserting document.',
          insertError,
        });
        reject(insertError);
      } else {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Document inserted.',
        });
        resolve(true);
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

export const uploadAttachments = (
  emailSubject: string,
  attachmentArray: Array<Object>,
  userId: string,
) => new Promise<any>((resolve, reject) => {
  const collection = dbObject.collection(`files_${userId}`);
  if (collection) {
    attachmentArray.forEach((attachment) => {
      logger.log({
        severity: STACKDRIVER_SEVERITY.DEBUG,
        level: LOG_LEVELS.DEBUG,
        message: 'Uploading attachment...',
        attachment,
      });
      // Create document for inserting.
      const now = new Date(Date.now()).toISOString();
      const {
        originalname, mimetype, encoding, size,
      } = attachment;
        // Open the file to get it's binary data:
        // @ TODO -> Test that this can be swapped to convertToBinary.
      convertSingleToBinary(attachment)
        .then((binaryData) => {
          logger.log({
            severity: STACKDRIVER_SEVERITY.DEBUG,
            level: LOG_LEVELS.DEBUG,
            message: 'Converted file to binary.',
          });
          const fileName = `${originalname}`;
          // Insert document.
          collection.insertOne(
            {
              name: fileName, // @ TODO -> Figure out a better scheme for naming email attachments.
              mimetype,
              encoding,
              binaryData: Binary(binaryData),
              size,
              uploadedAt: now,
              tags: ['attachment'],
              comment: `This file was uploaded as an attachment to an email with the subject: ${emailSubject}`,
            },
            (insertError) => {
              if (insertError) {
                logger.log({
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Error inserting document.',
                  insertError,
                });
              } else {
                logger.log({ level: LOG_LEVELS.DEBUG, message: 'Document inserted.' });
              }
            },
          );
        })
        .catch((convertFileToBinaryErr) => {
          logger.log({
            severity: STACKDRIVER_SEVERITY.ERROR,
            level: LOG_LEVELS.ERROR,
            message: 'Error converting file to binary:',
            convertFileToBinaryErr,
          });
        });
    });
    resolve(true);
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Updates one or more files in MongoDB.
 * @param {Array<string>} binaryData - An array containing the binary format of each file uploaded.
 * @param {Array<Object>} files - An array of objects containing file information such as name.
 * @param {string} userId - The ID of the user who owns the files.
 * @param {boolean} isUpdate - Flag determining if this is an update operation. (Default: FALSE)
 * @param {string} comment - Any specified comment for this upload entered by the user. (Default: '')
 * @param {Array<string>} tags - An array of any tags specified for this upload by the user. (Default: [])
 * @returns {boolean | Error} - Returns either true, or an error if there is a failure.
 */
export const updateFile = (
  binaryData: Array<Object>,
  files: Array<Object>,
  userId: string,
  comment: string,
  tags: Array<string>,
) => new Promise<boolean>((resolve, reject) => {
  const collection = dbObject.collection(`files_${userId}`);
  if (collection) {
    // For each file, add the document.
    concatDocs(binaryData, files, userId, true, '', [])
      .then((documentArray) => {
        _.forEach(documentArray, (document) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Updating the following document: ',
            name: document.name,
            comment,
            tags,
          });
          const newUploadDate = new Date(Date.now()).toISOString();
          const filter = { name: document.name };
          const update = {
            $set: {
              binaryData: document.binaryData,
              uploadedAt: newUploadDate,
              comment,
              tags,
            },
          };
          collection.updateOne(filter, update, (error, count, status) => {
            if (error) {
              logger.log({
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error updating documents.',
                error,
              });
              reject(error);
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Documents updated',
                count,
                status,
              });
              resolve(true);
            }
          });
        });
      })
      .catch((error) => {
        reject(error);
      });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Checks the database to retrieve the current storage usage of the user.
 * If no information about the user is found, create a default document with default limimts.
 * @param {string} userId - The ID of the user to check storage for.
 * @returns {Promise<Object>} - A document containing storage info or the newly created document.
 */
export const getOrCreateStorageUsage = (userId: string) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject && dbObject.serverConfig && dbObject.serverConfig.isConnected(),
  });
  // If the connection to ProvenDB has failed for some reason, try to reconnect it before failing.
  if (!(dbObject && dbObject.serverConfig && dbObject.serverConfig.isConnected())) {
    // Not connected, try reconnect.
    connectToProvenDB()
      .then(() => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Reconnected to ProvenDB:',
          isConnected: dbObject.serverConfig.isConnected(),
        });
      })
      .catch((err) => {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to reconnect to ProvenDB on second try.',
          err,
        });
        reject(err);
          return; //eslint-disable-line
      });
  }
  const collection = dbObject.collection(COLLECTION_NAMES.USER_INFO);
  const queryFilter = { _id: userId };
  if (collection) {
    collection
      .find(queryFilter, { promoteLongs: false })
      .toArray((queryError, result) => {
        if (queryError) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error finding documents',
            queryError,
          });
          reject(new Error({ message: 'Error finding documents.' }));
        } else {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Documents found',
            result,
          });
          if (result.length === 0) {
            // Create a new document with default storage limits.
            const newDocument = {
              _id: userId,
              storageUsed: 0,
              documentsUsed: 0,
              storageLimit: STORAGE_LIMITS.DEFAULT_SIZE,
              documentsLimit: STORAGE_LIMITS.DEFAULT_DOCUMENTS,
            };
            collection.insertOne(newDocument, (insertError, insertResult) => {
              if (insertError) {
                logger.log({
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Error inserting storage document',
                  insertError,
                });
                reject(insertError);
              } else {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Storage Documents Inserted',
                  insertResult,
                });
                resolve(newDocument);
              }
            });
          } else {
            resolve(result);
          }
        }
      });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Gets the list of current files uploaded by the user.
 * @param {string} userId - The ID of the user requesting a file list.
 * @returns {Array<Object>} - An array of files.
 */
export const getFilesList = (userId: string) => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject && dbObject.serverConfig && dbObject.serverConfig.isConnected(),
  });
  // If the connection to ProvenDB has failed for some reason, try to reconnect it before failing.
  if (!(dbObject && dbObject.serverConfig && dbObject.serverConfig.isConnected())) {
    // Not connected, try reconnect.
    connectToProvenDB()
      .then(() => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Reconnected to ProvenDB:',
          isConnected: dbObject.serverConfig.isConnected(),
        });
      })
      .catch((err) => {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to reconnect to ProvenDB on second try.',
          err,
        });
        reject(err);
          return; //eslint-disable-line
      });
  }

  const collection = dbObject.collection(`files_${userId}`);
  const queryFilter = {};
  const projectionFilter = { binaryData: false };
  showMetadata()
    .then(() => {
      if (collection) {
        collection
          .find(queryFilter, { promoteLongs: false })
          .project(projectionFilter)
          .toArray((queryError, result) => {
            if (queryError) {
              logger.log({
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error finding documents',
                queryError,
              });
              reject(new Error({ message: 'Error finding documents.' }));
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Documents found',
                result,
              });
              resolve(result);
            }
          });
      } else {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error getting collection.',
        });
        reject(new Error({ message: 'Error getting collection!' }));
      }
    })
    .catch((showMetadataErr) => {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error showing metadata for file list.',
        mongoError: showMetadataErr.message,
      });
      reject(new Error({ message: 'Error getting metadata for file list!' }));
    });
});

/**
 * NOTE: This approach will not work until a fix is placed in ProvenDB to provide default indexes.
 * Creates an index on the collection or returns if that index already exists.
 * @param {string} userId - The ID of the user to check for an index with.
 * @returns {boolean} - Either true if the collection was found / created, otherwise false.
 */
export const findOrCreateIndex = (userId: string) => new Promise<any>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(`files_${userId}`);
  const indexObject = { name: 1 };
  if (collection) {
    collection.createIndex(indexObject, (error, indexName) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error ensuring index.',
          indexObject,
          collectionName: `files_${userId}`,
          error,
        });
        reject(new Error({ message: 'Error ensuring index!' }));
      } else if (indexName) {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Index added.',
          indexObject,
          collectionName: `files_${userId}`,
          indexName,
        });
        resolve(true);
      } else {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error ensuring index, no index name returned.',
          indexObject,
          collectionName: `files_${userId}`,
        });
        reject(new Error({ message: 'Error ensuring index' }));
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Retrieve sharing info for a given user and file.
 * @param {string} userId - The user the file belongs to.
 * @param {string} fileId - The file to retrieve sharing info for.
 * @returns {Promise} - A promise resolving the sharing information object.
 */
export const getSharingInfo = (userId: string, fileId: string, version: string) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(COLLECTION_NAMES.SHARING_INFO);
  const queryFilter = { userId, fileId, version };
  const projectionFilter = {};
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Filter for getting share info: ',
    queryFilter,
  });
  if (collection) {
    collection
      .find(queryFilter, { promoteLongs: false })
      .project(projectionFilter)
      .toArray((queryError, result) => {
        if (queryError) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error finding documents',
            queryError,
          });
          reject(queryError);
        } else {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Documents found',
            result,
          });
          resolve(result);
        }
      });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Remove sharing info for a given file and user.
 * @param {string} userId - The user the file belongs to.
 * @param {string} fileId - The ID of the file for sharing to be removed.
 * @param {string} version - The target version of the file.
 * @param {'email' | 'link'} type - Which type of sharing to disable, email or link (Default: link)
 * @returns {Object} - The MongoDB result of the updateOne query.
 */
export const clearSharingInfo = (userId: string, fileId: string, version: string, type: string) => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(COLLECTION_NAMES.SHARING_INFO);
  const filter = { userId, fileId, version };
  let update = {};
  if (!type || (type !== 'link' && type !== 'email')) {
    type = 'link';
  }
  if (type === 'email') {
    update = { $unset: { emailLink: '', emails: '' } };
  } else if (type === 'link') {
    update = { $unset: { public: '', url: '' } };
  }
  if (collection) {
    collection.updateOne(filter, update, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Create a static link that users can navigate to for viewing your shared document.
 * @param {string} userId - The user who owns the file.
 * @param {string} fileId - The ID of the file to be shared.
 * @param {string} shareString - The string that should be used to create the share link.
 * @param {number} version - The target version of the file.
 * @returns {Promise} - A promise resolving the link if succeeded, error message if failed.
 */
export const addShareLink = (user: Object, fileId: string, shareString: string, version: number) => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(COLLECTION_NAMES.SHARING_INFO);
  const filter = { fileId, userId: user._id };
  const update = { $set: { public: true, url: shareString } };
  const options = {};
  if (collection) {
    collection.findOne(filter, { promoteLongs: false }, (findError, findResult) => {
      if (findError) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error finding documents',
          findError,
        });
        reject(findError);
      } else if (findResult) {
        // Share document already exists, modify it.
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Result of find: ',
          findResult,
        });
        collection.updateOne(filter, update, options, (queryError, result) => {
          if (queryError) {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Error finding documents',
              queryError,
            });
            reject(queryError);
          } else {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Documents Updated',
              result,
            });
            resolve(result);
          }
        });
      } else {
        // Share document does not exist, create it.
        const insertDoc = {
          fileId,
          userId: user._id,
          author: user.email,
          url: shareString,
          public: true,
          version,
        };
        collection.insertOne(insertDoc, (insertError, insertResult) => {
          if (insertError) {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Error finding documents',
              insertError,
            });
            reject(insertError);
          } else {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Documents Inserted',
              insertResult,
            });
            resolve(insertResult);
          }
        });
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Add or update a list of emails who can publicly access this file.
 * @param {Object} user - The user who owns the file.
 * @param {string} fileId - The ID of the file to be shared.
 * @param {Array<string>} emails - A list of emails that have access to the file.
 * @param {string} shareString - A generated string for sharing this file with users.
 * @param {number} version - The target version of the file.
 * @returns {Promise} - A promise resolving the link if succeeded, error message if failed.
 */
export const addShareEmail = (
  user: Object,
  fileId: string,
  emails: Array<string>,
  shareString: string,
  version: number,
) => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(COLLECTION_NAMES.SHARING_INFO);
  const filter = { fileId, userId: user._id };
  let update = { $set: { emails } };
  const options = {};
  if (collection) {
    collection.findOne(filter, { promoteLongs: false }, (findError, findResult) => {
      if (findError) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error finding documents',
          findError,
        });
        reject(findError);
      } else if (findResult) {
        // Share document already exists, modify it.
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Result of find: ',
          findResult,
        });
        if (!findResult.emailLink) {
          update = {
            $set: { emails, emailLink: shareString },
          };
        }
        collection.updateOne(filter, update, options, (queryError, result) => {
          if (queryError) {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Error updating documents',
              queryError,
            });
            reject(queryError);
          } else {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Documents Updated',
              result,
            });
            resolve(result);
          }
        });
      } else {
        // Share document does not exist, create it.
        collection.insertOne(
          {
            fileId,
            userId: user._id,
            author: user.email,
            emails,
            emailLink: shareString,
            version,
          },
          (insertError, insertResult) => {
            if (insertError) {
              logger.log({
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error finding documents',
                insertError,
              });
              reject(insertError);
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Documents Inserted',
                insertResult,
              });
              resolve(insertResult);
            }
          },
        );
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection.',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Given a shareString, fetch the file associated with that link.
 * @param {string} link - The link associated with a file for fetching.
 * @returns {Object} - The result of a findOne against that link.
 */
export const getSharedFile = (fileId: string, userId: string, version: number) => new Promise<any>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(COLLECTION_NAMES.SHARING_INFO);
  const filter = { $and: [{ fileId }, { userId }, { version }] };
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Query Filter for Finding shared file',
    filter,
  });
  if (collection) {
    collection.findOne(filter, { promoteLongs: false }, (findError, findResult) => {
      if (findError) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error finding shared file from link.',
        });
        reject(new Error({ message: 'Error finding shared file from link' }));
      } else if (findResult) {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Find result for share',
          findResult,
        });
        resolve(findResult);
      } else {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'No file found matching link.',
          findError,
          findResult,
        });
        reject(new Error({ message: 'No file found matching link.' }));
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

/**
 * Simple helper function for running the docHistory command.
 * @param {string} fileName - The name of the file to serach history for.
 * @param {string} userId - The userID of the file owner.
 * @returns {Promise} A promise resolving the document history, or rejecting an error.
 */
export const getFileHistory = (fileName: string, userId: string) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = `files_${userId}`;
  const filter = {
    name: fileName,
  };
  const projection = {
    binaryData: 0,
  };
  const command = { docHistory: { collection, filter, projection } };
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Query for finding history is',
    command,
  });
  dbObject.command(command, (error, result) => {
    if (error) {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Failed to run command!',
        collection,
        filter,
        error,
      });
      reject(error);
    } else {
      // Got file history, now for each file get proofStatus.
      const returnObject = result.docHistory[0];
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Result of doc history command',
        returnObject,
      });
      resolve({ docHistory: returnObject });
    }
  });
});

/**
 * Retrieves a file at a particular version.
 * @param {String | null} fileName - The name of the file to get a historical version for.
 * @param {String} userId - The ID of the user the file belongs to.
 * @param {Number} version - The version of the file.
 * @param {string | null} fileId - The ID of the file, will be used instead of fileName if provided.
 * @returns {Array<Object>} - Array of files fetched from MongoDB.
 */
export const getHistoricalFile = (
  fileName: string | null,
  userId: string,
  version: string,
  fileId: string | null,
) => new Promise<Array<Object>>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Getting historical file',
    fileName,
    userId,
    version,
    fileId,
  });

  const collectionName = `files_${userId}`;
  let filter: any = {};
  if (fileId && fileId != null) {
    if (parseInt(version, 10)) {
      filter = {
        _id: new mongo.ObjectId(fileId),
        '_provendb_metadata.minVersion': parseInt(version, 10),
      };
    } else {
      filter = {
        _id: new mongo.ObjectId(fileId),
      };
    }
  } else if (parseInt(version, 10)) {
    filter = {
      name: fileName,
      '_provendb_metadata.minVersion': parseInt(version, 10),
    };
  } else {
    filter = {
      name: fileName,
    };
  }

  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Query for file history.',
    collectionName,
    filter,
  });
  dbObject.command({ showMetadata: true }, (error) => {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Driver Client Status:',
      isConnected: dbObject.serverConfig.isConnected(),
    });
    if (error) {
      reject(error);
    } else {
      const collection = dbObject.collection(collectionName);
      if (collection) {
        collection.find(filter, { promoteLongs: false }).toArray((queryError, result) => {
          if (queryError) {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to query files for historical file',
              queryError,
            });
            reject(queryError);
          } else if (result[0]) {
            resolve(result);
          } else {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Found no matching files.',
              queryError,
            });
            reject(new Error("Didn't find any file."));
          }
        });
      } else {
        reject(new Error('Couldnt get collection'));
      }
    }
  });
});

/**
 * Get information for a single file, including the metadata.
 * @param {string} fileId - The ID of the file to get information about.
 * @param {*} userId - The ID of the user who owns the file.
 * @param {*} isSecondTry - Is this the second time this has run? (For auto-retry)
 * @param {boolean} filePreviewOnly - Get file information only for preview skiping binaryData
 * @returns {Object} - The document from MongoDB including metadata.
 */
export const getFileInformation = (
  fileId: string,
  userId: string,
  isSecondTry: boolean,
  filePreviewOnly: boolean,
) => new Promise<Array<Object>>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(`files_${userId}`);
  const queryFilter = { _id: new mongo.ObjectId(fileId) };
  let projectionFilter = {};
  if (filePreviewOnly !== undefined && filePreviewOnly) {
    projectionFilter = { binaryData: 0 };
  }
  if (collection) {
    dbObject.command({ showMetadata: true }, (error, metaDataResult) => {
      if (error) {
        reject(error);
      } else {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Query for getting file information',
          resultOfShowMetadata: metaDataResult,
          queryFilter,
          projectionFilter,
          collectionName: `files_${userId}`,
        });
        collection
          .find(queryFilter, { promoteLongs: false })
          .project(projectionFilter)
          .limit(1)
          .toArray((queryError, result) => {
            if (queryError) {
              logger.log({
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error finding documents',
                queryError,
              });
              reject(queryError);
            } else if (result && result[0]) {
              if (!result[0]._provendb_metadata) {
                const returnObject = {
                  level: LOG_LEVELS.ERROR,
                  severity: STACKDRIVER_SEVERITY.ERROR,
                  message: 'Proxy did not return any metadata :(',
                  result,
                };
                logger.log(returnObject);
                // Try Once more.
                if (isSecondTry) {
                  const returnObjectAgain = {
                    level: LOG_LEVELS.ERROR,
                    severity: STACKDRIVER_SEVERITY.ERROR,
                    message: 'Proxy did not return any metadata AGAIN :(',
                    result,
                  };
                  logger.log(returnObjectAgain);
                  reject(returnObjectAgain);
                } else {
                  getFileInformation(fileId, userId, true, filePreviewOnly)
                    .then((res) => {
                      resolve(res);
                    })
                    .catch((err) => {
                      reject(err);
                    });
                }
              } else {
                logger.log({
                  level: LOG_LEVELS.DEBUG,
                  severity: STACKDRIVER_SEVERITY.DEBUG,
                  message: 'Result of get Document',
                  fileName: result[0].name,
                  metadata: result[0]._provendb_metadata,
                });
                resolve(result);
              }
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Could not find file matching',
                userId,
                queryFilter,
              });
              reject(result);
            }
          });
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Error getting collection',
      userId,
    });
    reject(new Error({ message: 'Error getting collection!' }));
  }
});

export const getFileThumbnail = (fileId: string, userId: string) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const collection = dbObject.collection(`thumbs_${userId}_pdbignore`);
  const queryFilter = { _id: new mongo.ObjectId(fileId) };
  const projectionFilter = {};
  if (collection) {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Query for getting file thumbnail',
      queryFilter,
      collectionName: `thumbs_${userId}_pdbignore`,
    });
    collection
      .find(queryFilter, { promoteLongs: false })
      .project(projectionFilter)
      .limit(1)
      .toArray((queryError, result) => {
        if (queryError) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error finding documents in thumbnail collection',
            queryError,
          });
          reject(queryError);
        } else if (result && result[0]) {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Result of get Document Thumbnail',
            result: _.omit(result[0], 'binaryData'),
          });
          resolve(result[0]);
        } else {
          reject(new Error('no documents found in thumbnail collection'));
        }
      });
  }
});

export const createNewProof = () => new Promise<boolean>((resolve) => {
  debouncedSubmitProof();
  resolve(true);
});

export const createNewProofImmediately = () => new Promise<boolean>((resolve) => {
  submitProof();
  resolve(true);
});

export const checkProofStatus = (version: number) => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Checking proof status',
    version,
  });
  // Get proof for a version.
  dbObject.command({ getProof: version }, (getProofError, getProofResult) => {
    if (getProofError) {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error getting proof',
        getProofError,
      });
      reject(new Error({ message: 'Error getting proof: ', getProofError }));
    } else {
      logger.log({
        level: LOG_LEVELS.INFO,
        severity: STACKDRIVER_SEVERITY.INFO,
        message: 'Proof Status for version',
        version,
        status: getProofResult,
      });
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Got File History.',
        getProofResult,
      });
      resolve(getProofResult);
    }
  });
});

export const getFileVersionCount = (fileId: string, userId: string) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const filter = { _provendb_metadata: { $exists: true }, _id: new mongo.ObjectId(fileId) };
  const projection = { _id: 1 };
  const collection = dbObject.collection(`files_${userId}`);
  logger.log({
    level: LOG_LEVELS.INFO,
    severity: STACKDRIVER_SEVERITY.INFO,
    message: 'Filter:',
    filter,
    isConnected: dbObject.serverConfig.isConnected(),
  });
  if (collection) {
    collection
      .find(filter)
      .project(projection)
      .toArray((queryError, result) => {
        if (!queryError) {
          resolve(result);
        } else {
          reject(new Error(`Find failed with error ${queryError}`));
        }
      });
  } else {
    reject(new Error('Unable to get collection.'));
  }
});

export const getVersionProofForFile = (fileInfo: Object, getJSON: boolean, proofID: string) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const { minVersion } = fileInfo._provendb_metadata;
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Fetching proof information for file: ',
    fileName: fileInfo.name,
    minVersion,
  });
  let format = 'binary';
  if (getJSON === true) {
    format = 'json';
  }

  dbObject.command({ getProof: proofID, format }, (getProofError, getProofResult) => {
    if (getProofError) {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error getting proof',
        getProofError,
      });
      reject(new Error({ message: 'Error getting proof: ', getProofError }));
    } else {
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Version proof Status for file',
        fileName: fileInfo.name,
        minVersion,
        status: getProofResult,
      });
      resolve(getProofResult);
    }
  });
});

export const getDocumentProofForFile = (
  fileInfo: Object,
  userId: string,
  format: string = 'binary',
) => new Promise<Object>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Fetching document proof information for file: ',
    isConnected: dbObject.serverConfig.isConnected(),
    fileName: fileInfo.name,
    fileMetadata: fileInfo._provendb_metadata,
  });
  const { minVersion } = fileInfo._provendb_metadata;
  const { name } = fileInfo;

  // Get proof for a version.
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Query for getDocument Proof:',
    query: {
      getDocumentProof: {
        collection: `files_${userId}`,
        filter: { name },
        version: minVersion,
        format: 'binary',
      },
    },
  });
  dbObject.command(
    {
      getDocumentProof: {
        collection: `files_${userId}`,
        filter: { name },
        version: minVersion,
        format,
      },
    },
    (getProofError, getProofResult) => {
      if (getProofError) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error getting proof',
          getProofError,
        });
        reject(new Error({ message: 'Error getting proof: ', getProofError }));
      } else {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Proof Status for document',
          minVersion,
          status: getProofResult,
        });
        resolve(getProofResult);
      }
    },
  );
});

/**
 * Forgets a file (all verions) from the database using the forget runCommand.
 * @param {string} fileId - The ID of the file t obe forgotten.
 * @param {string} userId - The ID of the user forgetting a document.
 * @returns {*} true if succeeded, object with error if failed.
 */
export const forgetFile = (fileId: string, userId: string) => new Promise<void>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Driver Client Status:',
    isConnected: dbObject.serverConfig.isConnected(),
  });
  const _deleteThumbnail = () => {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Deleting Thumbnails generated for file',
      userId,
      fileId,
    });

    const thumbCollection = dbObject.collection(`thumbs_${userId}_pdbignore`);
    const queryFilter = { _id: new mongo.ObjectId(fileId) };

    thumbCollection.deleteMany(
      queryFilter,
      { promoteLongs: false },
      (deleteError, deleteResult) => {
        if (deleteError) {
          logger.log({
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Error Deleting Thumbnail',
            deleteError,
          });
          reject(deleteError);
        } else {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Result of deleting Thumbnail',
            deleteResult,
          });
        }
      },
    );
  };
  const collection = dbObject.collection(`files_${userId}`);
  const filter = { _id: new mongo.ObjectId(fileId) };
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Forgetting a document.',
    userId,
    fileId,
    collection: `files_${userId}`,
  });

  if (!collection) {
    reject(new Error('Failed to get collection'));
  } else {
    // First, delete the document (so that it does not exist in the current version).
    collection.deleteMany(filter, { promoteLongs: false }, (deleteError, deleteResult) => {
      if (deleteError) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error Deleting Documents',
          deleteError,
        });
        reject(deleteError);
      } else {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Result of deleting document (for forget)',
          deleteResult,
        });
        _deleteThumbnail();
        // Secondly, prepare a forget for the document ( to get the forget password).
        dbObject.command(
          {
            forget: {
              prepare: {
                collection: `files_${userId}`,
                filter,
              },
            },
          },
          (prepareError, prepareResult) => {
            if (prepareError) {
              logger.log({
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Error Preparing Forget',
                prepareError,
              });
              reject(prepareError);
            } else {
              logger.log({
                level: LOG_LEVELS.DEBUG,
                severity: STACKDRIVER_SEVERITY.DEBUG,
                message: 'Result of preparing document (for forget)',
                prepareResult,
              });
              const { password, forgetId } = prepareResult;
              dbObject.command(
                {
                  forget: {
                    execute: {
                      forgetId,
                      password,
                    },
                  },
                },
                (executeError, executeResult) => {
                  if (executeError) {
                    logger.log({
                      level: LOG_LEVELS.ERROR,
                      severity: STACKDRIVER_SEVERITY.ERROR,
                      message: 'Error executing Forget',
                      executeError,
                    });
                    reject(executeError);
                  } else {
                    logger.log({
                      level: LOG_LEVELS.DEBUG,
                      severity: STACKDRIVER_SEVERITY.DEBUG,
                      message: 'Result of executing forget',
                      executeResult,
                    });
                    resolve(executeResult);
                  }
                },
              );
            }
          },
        );
      }
    });
  }
});
