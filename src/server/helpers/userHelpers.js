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
import TextReader from 'file2html-text';
import rp from 'request-promise';
import OOXMLReader from 'file2html-ooxml';
import ImageReader from 'file2html-image';
import jwt from 'jsonwebtoken';
import { GraphQLClient } from 'graphql-request';
import * as file2html from 'file2html';
import { DOMAINS, LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';
import { verifyTokenFromUserModule } from './authHelpers';
import { authFormat } from '../modules/winston.config';

file2html.config({
  readers: [TextReader, OOXMLReader, ImageReader],
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
      json: true,
      colorize: true,
      format: authFormat,
    }),
  ],
});

/**
 * Queries our back end user service to find a users ID given their JWT token.
 * @param {Object} token - The JWT token provided during login.
 * @param {string} secret - Secret string used to verify the server.
 */
export const getUserFromToken = (req: any, res: any, secret: Object) => new Promise<any>((resolve, reject) => {
  logger.log({
    level: LOG_LEVELS.INFO,
    severity: STACKDRIVER_SEVERITY.INFO,
    message: 'getUserFromToken: ',
    cookies: req.cookies,
  });
  if (req.cookies && req.cookies.AuthToken && req.cookies.RefreshToken) {
    const { AuthToken } = req.cookies;
    jwt.verify(AuthToken, secret, (err, decoded) => {
      logger.log({
        level: LOG_LEVELS.DEBUG,
        severity: STACKDRIVER_SEVERITY.DEBUG,
        message: 'jwt.verify: ',
        decoded,
        err,
      });
      if (err) {
        if (err.name === 'TokenExpiredError') {
          verifyTokenFromUserModule(req, res, secret)
            .then((result) => {
              logger.log({
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'verifyTokenFromUserModule: ',
                result,
              });
              jwt.verify(result.auth_token, secret, (errVerify, decodedNewToken) => {
                logger.log({
                  level: LOG_LEVELS.INFO,
                  severity: STACKDRIVER_SEVERITY.INFO,
                  message: 'jwt.verify.newToken: ',
                  decodedNewToken,
                  errVerify,
                });
                if (errVerify) {
                  reject(errVerify);
                } else {
                  resolve({ _id: decodedNewToken.sub, auth_token: result.auth_token });
                }
              });
            })
            .catch((errUpdate) => {
              reject(errUpdate);
            });
        } else {
          reject(err);
        }
      } else {
        resolve({ _id: decoded.sub, auth_token: AuthToken });
      }
    });
  } else {
    reject(new Error('Cookies not found.'));
  }
});

/**
 * Queries our back end user service to find user details given their JWT token.
 * @param {Object} token - The JWT token provided during login.
 * @param {string} secret - Secret string used to verify the server.
 * @returns {userInformation} - An object containing the users
 */
export const getUserDetails = (req: any, res: any, secret: Object) => new Promise<any>((resolve, reject) => {
  getUserFromToken(req, res, secret)
    .then((user) => {
      const userID = user._id;
      const endpoint = `${DOMAINS.INTERNAL_API}/query`;
      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          Authorization: `Bearer ${user.auth_token}`,
        },
      });
      const query = `
          {getUser(
              userID: "${userID}"
            ) {
              id
              email
              name
              provider
              githubID
              googleID
          }
        }
        `;
      graphQLClient
        .request(query)
        .then((data: Object) => {
          data.getUser._id = data.getUser.id;
          resolve(data.getUser);
        })
        .catch((err) => {
          reject(new Error(`graphql query failed: ${err.message}`));
        });
    })
    .catch((err) => {
      reject(new Error(`Token not valid: ${err.message}`));
    });
});

export const getUserFromEmail = (fromEmail: string) => new Promise<any>((resolve, reject) => {
  try {
    logger.log({
      level: LOG_LEVELS.DEBUG,
      severity: STACKDRIVER_SEVERITY.DEBUG,
      message: 'Request to get user from email:',
      fromEmail,
      endpoint: `${DOMAINS.INTERNAL_API}/api/getuser?email=${fromEmail}`,
      secret: process.env.PROVENDOCS_SECRET,
    });
    const endpoint = `${DOMAINS.INTERNAL_API}/api/getuser?email=${fromEmail}`;
    /*  axios
    // $FlowFixMe
      .get(endpoint, { headers: { Authorization: `Bearer ${process.env.PROVENDOCS_SECRET}` } }) */
    rp({
      uri: endpoint,
      headers: {
        // $FlowFixMe
        Authorization: `Bearer ${process.env.PROVENDOCS_SECRET}`,
      },
      json: true,
    })
      .then((res) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          message: 'Result of get user from email:',
          res,
        });
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  } catch (error) {
    reject(error);
  }
});

export const createUser = (user: Object) => new Promise<any>((resolve, reject) => {
  const endpoint = `${DOMAINS.INTERNAL_API}/query`;
  const graphQLClient = new GraphQLClient(endpoint);
  const query = `
          mutation{
            createUser(
              email: "${user.email}", 
              name:"${user.name}", 
              password:"${user.password}", 
              activated:${user.activated}
              ) {
              success
              userID
              authToken
              refreshToken
            }
          }
        `;
  graphQLClient
    .request(query)
    .then((data: Object) => {
      resolve(data.createUser);
    })
    .catch((err) => {
      if (err.response.errors[0]) {
        const errMsg = err.response.errors[0].message;
        reject(new Error(errMsg));
      }
      reject(new Error('graphql query failed.'));
    });
});

export const validateUser = (user: Object) => new Promise<any>((resolve, reject) => {
  const endpoint = `${DOMAINS.INTERNAL_API}/query`;
  const graphQLClient = new GraphQLClient(endpoint);
  const query = `
          query{
            validateUser(
              email: "${user.email}", 
              password:"${user.password}", 
              ) {
              success
              userID
              authToken
              refreshToken
            }
          }
        `;
  graphQLClient
    .request(query)
    .then((data: Object) => {
      resolve(data.validateUser);
    })
    .catch((err) => {
      if (err.response.errors[0]) {
        const errMsg = err.response.errors[0].message;
        reject(new Error(errMsg));
      }
      reject(new Error('graphql query failed.'));
    });
});
