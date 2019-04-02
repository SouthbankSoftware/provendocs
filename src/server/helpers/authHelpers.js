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
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { GraphQLClient } from 'graphql-request';
import { authFormat } from '../modules/winston.config';
import { DOMAINS, LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';

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

export const resetTokenCookies = (req: Object, res: Object) => {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'Reset Token Cookies: ',
    cookies: req.cookies,
  });
  if (req.cookies && req.cookies.AuthToken) {
    res.cookie('AuthToken', '', {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
  }
  if (req.cookies && req.cookies.RefreshToken) {
    res.cookie('RefreshToken', '', {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
  }
};
function checkStatus(res) {
  logger.log({
    level: LOG_LEVELS.DEBUG,
    severity: STACKDRIVER_SEVERITY.DEBUG,
    message: 'checkStatus',
    res,
  });
  if (res.ok) {
    // res.status >= 200 && res.status < 300
    return res;
  }
  throw Error(res.statusText);
}
export const verifyTokenFromUserModule = (req: Object, res: Object, jwtSecret: Object) => new Promise<any>((resolve, reject) => {
  if (req.cookies && req.cookies.AuthToken && req.cookies.RefreshToken) {
    const { AuthToken } = req.cookies;
    jwt.verify(AuthToken, jwtSecret, (err) => {
      if (err && err.name !== 'TokenExpiredError') {
        resetTokenCookies(req, res);
        logger.log({
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: `Token is invalid. Error: ${err.message}`,
        });
        reject(new Error('Token is invalid.'));
        // res.status(400).send('Token is invalid.');
      } else {
        const postBody = {
          auth_token: req.cookies.AuthToken,
          refresh_token: req.cookies.RefreshToken,
        };
        logger.log({
          level: LOG_LEVELS.INFO,
          severity: STACKDRIVER_SEVERITY.INFO,
          message: `INTERNAL_API: ${DOMAINS.INTERNAL_API}/auth/verifytoken`,
        });
        fetch(`${DOMAINS.INTERNAL_API}/auth/verifytoken`, {
          method: 'post',
          body: JSON.stringify(postBody),
          headers: { 'Content-Type': 'application/json' },
        })
          .then(checkStatus)
          .then((result) => {
            result.json().then((jsonResponse) => {
              logger.log({
                level: LOG_LEVELS.INFO,
                severity: STACKDRIVER_SEVERITY.INFO,
                message: 'jsonResponse',
                jsonResponse,
              });
              if (jsonResponse.success === true) {
                res.cookie('AuthToken', jsonResponse.auth_token, {
                  // expires: new Date(Date.now() + 86400000), // Token has actual expiry of 15 mins but the cookie has to be present to give the token back
                  httpOnly: true,
                });
                res.cookie('RefreshToken', jsonResponse.refresh_token, {
                  expires: new Date(Date.now() + 259200000),
                  httpOnly: true,
                });
                logger.log({
                  level: LOG_LEVELS.INFO,
                  severity: STACKDRIVER_SEVERITY.INFO,
                  message: 'User Token is valid',
                });
                resolve({ status: 200, message: 'User token is valid.', ...jsonResponse });
                // res.status(200).send('User token is valid.');
              } else {
                resetTokenCookies(req, res);
                logger.log({
                  level: LOG_LEVELS.WARN,
                  severity: STACKDRIVER_SEVERITY.WARNING,
                  message: 'User token is revoked',
                  jsonResponse,
                });
                reject(new Error('User token is revoked.'));
                // res.status(400).send('User token is revoked.');
              }
            });
          })
          .catch((error) => {
            resetTokenCookies(req, res);
            logger.log({
              level: LOG_LEVELS.WARN,
              severity: STACKDRIVER_SEVERITY.WARNING,
              message: 'Token Authenticaton exception - User Token is Revoked.',
              error,
            });
            reject(new Error('User token is revoked.'));
            // res.status(400).send('User token is revoked.');
          });
      }
    });
  } else {
    logger.log({
      level: LOG_LEVELS.WARN,
      severity: STACKDRIVER_SEVERITY.WARNING,
      message: 'Cookies not found.',
    });
    reject(new Error('Cookies not found.'));
    // res.status(400).send('Cookies not found.');
  }
});

export const confirmUserViaEmail = (userID: string) => new Promise<any>((resolve, reject) => {
  const endpoint = `${DOMAINS.INTERNAL_API}/query`;
  const graphQLClient = new GraphQLClient(endpoint);
  const query = `
  mutation{
    updateUser(
      userID:"${userID}", 
      activated:true) {
      success
    }
  }
        `;
  graphQLClient
    .request(query)
    .then((data: Object) => {
      resolve(data.updateUser);
    })
    .catch((err) => {
      if (err.response.errors[0]) {
        const errMsg = err.response.errors[0].message;
        reject(new Error(errMsg));
      }
      reject(new Error('graphql query failed.'));
    });
});

export const resetPassword = (user: Object) => new Promise<string>((resolve, reject) => {
  const endpoint = `${DOMAINS.INTERNAL_API}/query`;
  const graphQLClient = new GraphQLClient(endpoint);
  const query = `
          mutation{
            resetPassword(
              email: "${user.email}", 
              ) {
              success
              newPassword
            }
          }
        `;
  graphQLClient
    .request(query)
    .then((data: Object) => {
      resolve(data.resetPassword);
    })
    .catch((err) => {
      if (err.response.errors[0]) {
        const errMsg = err.response.errors[0].message;
        reject(new Error(errMsg));
      }
      reject(new Error('graphql query failed.'));
    });
});
