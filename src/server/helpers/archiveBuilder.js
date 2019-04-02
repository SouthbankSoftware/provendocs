/*
 * @flow
 * Contains helper functions for creating a proof archive for user.
 * @Author: Michael Harrison
 * @Date:   2018-11-15T09:09:31+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-01T14:33:53+11:00
 */
import fs from 'fs';
import archiver from 'archiver';
import Path from 'path';
import winston from 'winston';
import { decodeFile } from './fileHelpers';
import createPDF from './certificateBuilder';
import { STACKDRIVER_SEVERITY, LOG_LEVELS, DOMAINS } from '../common/constants';
import { certificateAPIFormat } from '../modules/winston.config';

const EJSON = require('mongodb-extjson');

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
 * Simple helper function for constructing the contents of the Archive ReadMe File
 * @ TODO -> In future it would be great to use something like Handlebars for this instead.
 * @param {*} fileInformation  - The file document from MongoDB.
 * @param {*} userInformation - Information about the user profile.
 * @param {*} proofInformation - The documentProof for the file.
 * @param {*} versionProof - The versionProof for the file.
 * @returns {string} - A string containing the contents of the ReadMe file.
 */
const getReadMeString = (
  fileInformation: Object,
  userInformation: Object,
  proofInformation: Object,
  versionProof: Object,
) => {
  const { name, uploadedAt } = fileInformation;
  const { email } = userInformation;
  const { btcBlockNumber, btcTransaction } = proofInformation;
  const { submitted } = versionProof;
  const proofHash = versionProof.hash;
  const { hash } = fileInformation._provendb_metadata;
  const url = 'PLACEHOLDER_URL';
  let cliDownload = `${DOMAINS.PROVENDOCS}/downloads`;
  if (process.env.PROVENDOCS_ENV === 'TEST') {
    cliDownload = 'https://provendocs.com/downloads';
  } else if (process.env.PROVENDOCS_ENV === 'DEV') {
    cliDownload = 'http://localhost:3000/downloads';
  }

  const uploadedAtDate = String(new Date(uploadedAt)); // get it into same format as submitted date
  const readMeText = `
   Summary
   -------
   
   This archive "${name}.proof.zip" contains a ProvenDocs.com blockchain 
   proof for the document "${name}".
   
   "${name}" was uploaded to ProvenDocs on
    ${uploadedAtDate} 
   by ${email}
   and proved to the Bitcoin blockchain  at 
    ${submitted}.
   
   The bitcoin blockchain proof details are:
   
   \t*  Bitcoin block:          ${btcBlockNumber}
   \t*  Bitcoin transaction ID: ${btcTransaction}
   \t*  Document hash:          ${hash}
   \t*  ProvenDocs proof hash:  ${proofHash}
   
   Contents
   --------
   
   This archive contains the following files:
   
   * ${name}:              the file which was uploaded
   * ${name}.json:         the file data and metadata in ProvenDocs format
   * ${name}.proof.binary: the blockchain proof in Chainpoint binary format 
   * ${name}.proof.json:   the blockchain proof in Chainpoint JSON format
   * ${name}.proof.pdf:    the PDF blockchain proof certificate
   
   Viewing and validating the document proof
   -----------------------------------------
   
   You can view this document and it's proof (subject to permissions) at https://provendocs.com/${url}.
   
   You can validate this archive - confirming the integrity of the document
   and validity of the proof - using our open using our open source command-line tool.
   
   To independently validate this document proof:
   
   1.  Download the provendb-verify tool from ${cliDownload}
       Validate the data using the following command:
        provendb-verify --in "${name}.proof.zip"
   
   OR:
   
   2. Validate the ${name}.proof.json document using the toolset
      provided by the chainpoint project.  See http://chainpoint.org
      and https://github.com/chainpoint 
   
   ProvenDocs is powered by ProvenDB.  See https://provendb.com for more information.
   `;
  return readMeText;
};

/**
 * Creates an archive from the retrieved information including:
 * - The File.
 * - The File Information in JSON format.
 * - The Proof in JSON format.
 * - The Proof in Binary Format.
 * - The Proof certificate.
 * - A ReadMe file explaining the archive.
 * @param {Object} fileInformation - The file document from MongoDB.
 * @param {*} proofInformation - The VersionProof for the document.
 * @param {*} documentProof - The documentProof for the document.
 * @param {*} user - Information about the user profile.
 * @returns {string} The path to the archive for uploading to user.
 */
const createArchiveForDocument = (
  fileInformation: Object,
  proofInformation: Object,
  documentProof: Object,
  user: Object,
) => new Promise<string>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.INFO,
    severity: STACKDRIVER_SEVERITY.INFO,
    message: 'Creating archive...',
  });
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Archive Info: ',
    fileName: fileInformation.name,
    user,
    proofInformation,
    documentProof,
  });

  // Create Archive.
  const path = Path.join(__dirname, `archives/${fileInformation.name}.proof.zip`);
  const output = fs.createWriteStream(path);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });
    // Triggered on finish.
  output.on('close', () => {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'Done writing to archive',
      totalBytes: archive.pointer(),
    });
    resolve(path);
  });
  // Anytime a source is drained.
  output.on('end', () => {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Data has been drained.',
    });
  });
  // Catch non-blocking warnings.
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Error during archive process',
        err,
      });
    } else {
      logger.log({
        level: LOG_LEVELS.ERROR,
        severity: STACKDRIVER_SEVERITY.ERROR,
        message: 'Fatal error during archive process',
        err,
      });
      reject(err);
    }
  });
  // Catch blocking errors
  archive.on('error', (err) => {
    logger.log({
      level: LOG_LEVELS.ERROR,
      severity: STACKDRIVER_SEVERITY.ERROR,
      message: 'Fatal error during archive process',
      err,
    });
    reject(err);
  });
  // Pipe archive data to the file
  archive.pipe(output);

  decodeFile(fileInformation)
    .then((file) => {
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Adding file...',
        file,
        fileType: typeof file,
      });
      if (typeof file === 'object') {
        archive.append(JSON.stringify(file), { name: `${fileInformation.name}.json` });
      } else {
        archive.file(file, { name: `${fileInformation.name}` });
      }

      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'Adding Certificate..',
      });
      createPDF(
        { proofs: [proofInformation] },
        { proofs: [documentProof] },
        fileInformation,
        user,
      )
        .then((certPath) => {
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Success, Generated Certificate for file:',
            certPath,
            fileName: fileInformation.name,
            user,
          });

          // Add the Proof Certificate file to the Archive.
          archive.file(certPath, { name: `${fileInformation.name}.proof.pdf` });

          // Add the README.txt to the archive.
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Appending README...',
          });
          archive.append(
            getReadMeString(fileInformation, user, documentProof, proofInformation),
            {
              name: 'README.txt',
            },
          );

          // Add the JSON version of the file to archive:
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Adding JSON version of doc + metadata...',
          });
          archive.append(EJSON.stringify(fileInformation, null, 2), {
            name: `${fileInformation.name}.doc.json`,
          });

          // Add the Chainpoint blockchain proof in binary format.
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Adding Chainpoint Proof (binary)...',
          });
          const binaryString = JSON.stringify(documentProof.proof);
          archive.append(binaryString.slice(1, -1), {
            name: `${fileInformation.name}.proof.binary`,
          });

          // Add the Chainpoint proof in JSON format.
          logger.log({
            level: LOG_LEVELS.INFO,
            severity: STACKDRIVER_SEVERITY.INFO,
            message: 'Adding Chainpoint Proof (JSON)',
            documentProof,
          });
          archive.append(JSON.stringify(documentProof.proof), {
            name: `${fileInformation.name}.proof.json`,
          });

          // Finalize the archive.
          logger.log({
            level: LOG_LEVELS.DEBUG,
            severity: STACKDRIVER_SEVERITY.DEBUG,
            message: 'Finalizing Archive...',
          });
          archive.finalize();
        })
        .catch((createCertErr) => {
          const returnObject = {
            level: LOG_LEVELS.ERROR,
            severity: STACKDRIVER_SEVERITY.ERROR,
            message: 'Failed to create PDF Proof Certificate for Archive',
            createCertErr,
            fileName: fileInformation.name,
            proofInformation,
            documentProof,
          };
          logger.log(returnObject);
          reject(returnObject);
        });
    })
    .catch((decodeFileErr) => {
      reject(decodeFileErr);
    });
});
export default createArchiveForDocument;
