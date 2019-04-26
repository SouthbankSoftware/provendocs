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
import rp from 'request-promise';
import {
  getUserDetails,
  createUser,
  updateUser,
  validateUser,
  verifyTokenFromUserModule,
  confirmUserViaEmail,
  resetPassword,
  updatePassword,
  getUserFromEmail,
} from '../helpers/userHelpers';
import { findOrCreateIndex } from '../helpers/mongoAPI';
import {
  sendWelcomeToProvenDocsEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendSubscriptionConfirmationEmail,
  handleSubscriptionConfirmation,
} from '../helpers/sendgrid';
import { DOMAINS, STACKDRIVER_SEVERITY, LOG_LEVELS } from '../common/constants';
import { authFormat } from '../modules/winston.config';

module.exports = (app) => {
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: process.env.PROVENDOCS_LOG_LEVEL || LOG_LEVELS.DEBUG,
        json: true,
        colorize: true,
        format: authFormat,
      }),
    ],
  });

  app.get('/api/serviceUrls', (req, res) => {
    const urls = {};
    urls.ID = process.env.USER_MODULE_URL || 'http://localhost:8000';
    urls.PROVENDOCS = process.env.DOCS_URL
      || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:8888');
    urls.API = process.env.API_URL || 'http://localhost:8080';
    urls.INTERNAL_API = process.env.INTERNAL_API_URL || 'http://localhost:8080';
    urls.PROVENDOCS_ENV = process.env.PROVENDOCS_ENV || 'dev';
    res.status(200).send(JSON.stringify(urls));
  });
  app.get('/api/logout', (req, res) => {
    res.cookie('AuthToken', '', {
      expires: new Date(),
      httpOnly: true,
    });
    res.cookie('RefreshToken', '', {
      expires: new Date(),
      httpOnly: true,
    });
    res.redirect(`${DOMAINS.API}/auth/logout?redirectURL=${DOMAINS.PROVENDOCS}`);
  });
  app.get('/api/loginSucceeded', (req, res) => {
    const { authToken, refreshToken } = req.query;
    res.cookie('AuthToken', authToken, {
      // expires: new Date(Date.now() + 86400000),
      httpOnly: true,
    });
    res.cookie('RefreshToken', refreshToken, {
      expires: new Date(Date.now() + 259200000),
      httpOnly: true,
    });
    res.redirect('/dashboard');
  });

  app.get('/api/signupSucceeded', (req, res) => {
    const { authToken, refreshToken } = req.query;
    res.cookie('AuthToken', authToken, {
      expires: new Date(Date.now() + 90000),
      httpOnly: true,
    });
    res.cookie('RefreshToken', refreshToken, {
      expires: new Date(Date.now() + 25920000),
      httpOnly: true,
    });

    const customReqest = {
      cookies: {
        AuthToken: authToken,
        RefreshToken: refreshToken,
      },
    };
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'Signup Succeeded Cookies: ',
      cookies: customReqest.cookies,
    });
    getUserDetails(customReqest, res, app.get('jwtSecret'))
      .then((userDetails) => {
        sendWelcomeToProvenDocsEmail(userDetails.email)
          .then(() => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Sent Welcome Email.',
              toEmail: userDetails.email,
            });
          })
          .catch((sendWelcomeEmailErr) => {
            const returnObj = {
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.EMERGENCY,
              message: 'Failed to send welcome email.',
              sendWelcomeEmailErr,
              userDetails,
            };
            logger.log(returnObj);
          });
        // Check for collection / index.
        findOrCreateIndex(userDetails._id)
          .then((findOrCreateIndexRes) => {
            logger.log({
              level: LOG_LEVELS.DEBUG,
              severity: STACKDRIVER_SEVERITY.DEBUG,
              message: 'Found or created index for new user.',
              findOrCreateIndexRes,
            });
          })
          .catch((findOrCreateIndexErr) => {
            logger.log({
              level: LOG_LEVELS.ERROR,
              severity: STACKDRIVER_SEVERITY.ERROR,
              message: 'Failed to find or create index on collection',
              findOrCreateIndexErr,
            });
          });
      })
      .catch((getUserDetailsErr) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to get user details to send welcome email.',
          getUserDetailsErr,
          authToken,
        };
        logger.log(returnObj);
      })
      .finally(() => {
        logger.log({
          level: LOG_LEVELS.INFO,
          severity: STACKDRIVER_SEVERITY.INFO,
          message: 'Redirecting from Finally.',
        });
        res.redirect('/signupSuccess');
      });
  });

  app.get('/api/loginFailed', (req, res) => {
    const { reason, userID } = req.query;
    res.cookie('AuthToken', '', {
      expires: new Date(),
      httpOnly: true,
    });
    res.cookie('RefreshToken', '', {
      expires: new Date(),
      httpOnly: true,
    });
    let url = `/loginFailed?reason=${reason}`;
    if (userID && userID !== '') {
      const b64userID = Buffer.from(userID).toString('base64');
      url = `${url}&userID=${b64userID}`;
    }
    res.redirect(url);
  });

  app.get('/api/signupFailed', (req, res) => {
    const { reason, userID } = req.query;
    res.cookie('AuthToken', '', {
      expires: new Date(),
      httpOnly: true,
    });
    res.cookie('RefreshToken', '', {
      expires: new Date(),
      httpOnly: true,
    });
    let url = `/signupFailed?reason=${reason}`;
    if (userID && userID !== '') {
      const b64userID = Buffer.from(userID).toString('base64');
      url = `${url}&userID=${b64userID}`;
    }
    res.redirect(url);
  });

  app.get('/api/authenticate', (req, res) => {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Authenticating User.',
      cookies: req.cookies,
    });
    verifyTokenFromUserModule(req, res, app.get('jwtSecret'))
      .then((result) => {
        res.status(result.status).send(result.message);
      })
      .catch((err) => {
        res.status(400).send(err.message);
      });
  });

  app.get('/api/getUserDetails', (req, res) => {
    const { AuthToken } = req.cookies;
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Fetching User Details.',
      AuthToken,
    });
    getUserDetails(req, res, app.get('jwtSecret'))
      .then((details) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Got user details',
          details,
        });
        res.status(200).send(details);
      })
      .catch((getDetailsErr) => {
        const returnObj = {
          level: LOG_LEVELS.WARN,
          severity: STACKDRIVER_SEVERITY.WARNING,
          message: 'Failed to fetch user details',
          getDetailsErr,
        };
        logger.log(returnObj);
        res.status(400).send();
      });
  });

  app.post('/api/createUser', (req, res) => {
    createUser(req.body)
      .then((response) => {
        res.status(200).send(JSON.stringify(response));
      })
      .catch((error) => {
        res.status(400).send(error.message);
      });
  });

  app.post('/api/updateUser', (req, res) => {
    const { AuthToken } = req.cookies;
    updateUser(req.body, AuthToken)
      .then((response) => {
        res.status(200).send(JSON.stringify(response));
      })
      .catch((error) => {
        res.status(400).send(error.message);
      });
  });

  app.post('/api/authUser', (req, res) => {
    validateUser(req.body)
      .then((response) => {
        res.status(200).send(JSON.stringify(response));
      })
      .catch((error) => {
        res.status(400).send(error.message);
      });
  });

  app.post('/api/sendVerifyEmail', (req, res) => {
    sendVerificationEmail(req.body.toEmail, req.body.verifyLink)
      .then((response) => {
        res.status(200).send(response);
      })
      .catch((sendVerificationErr) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to send verification email.',
          sendVerificationErr,
          toEmail: req.body.toEmail,
        };
        logger.log(returnObj);
        res.status(400).send(returnObj);
      });
  });

  app.post('/api/resendVerifyEmail', (req, res) => {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: '[REQUEST] -> Re-Sending Verification Email',
      toEmail: req.body.toEmail,
    });
    const endpoint = `${DOMAINS.INTERNAL_API}/api/getuser?email=${req.body.toEmail}`;
    rp({
      uri: endpoint,
      headers: {
        Authorization: `Bearer ${process.env.PROVENDOCS_SECRET}`,
      },
      json: true,
    })
      .then((resUser) => {
        if (resUser && resUser.activated) {
          res.status(400).send({ message: 'User already activated. Try Log in.' });
        } else {
          const b64userID = Buffer.from(resUser.user_id).toString('base64');
          const verifyLink = `${DOMAINS.PROVENDOCS}/api/verifyUser?userID=${b64userID}`;
          sendVerificationEmail(req.body.toEmail, verifyLink)
            .then((response) => {
              res.status(200).send(response);
            })
            .catch((sendVerificationErr) => {
              const returnObj = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to send verification email.',
                sendVerificationErr,
                user: resUser,
              };
              logger.log(returnObj);
              res.status(400).send(returnObj);
            });
        }
      })
      .catch(() => {
        res.status(400).send(false);
      });
  });

  app.get('/api/checkUserExists', (req, res) => {
    const { email } = req.query;
    const result = {
      found: false,
      provider: '',
    };
    getUserFromEmail(email)
      .then((userDetails) => {
        logger.log({
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Got user details for oauth email',
          userDetails,
        });
        if (userDetails && userDetails.email === email) {
          result.found = true;
          result.provider = userDetails.provider;
        }
        res.status(200).send(result);
      })
      .catch((checkUserError) => {
        const returnObj = {
          level: LOG_LEVELS.DEBUG,
          severity: STACKDRIVER_SEVERITY.DEBUG,
          message: 'Failed to find email in checkUserExists.',
          checkUserError,
        };
        logger.log(returnObj);
        res.status(200).send(result);
      });
  });

  app.get('/api/verifyUser', (req, res) => {
    const { userID } = req.query;
    const decUserID = Buffer.from(userID, 'base64').toString();
    confirmUserViaEmail(decUserID, '')
      .then((response) => {
        if (response.success) {
          res.redirect('/signup/emailConfirm');
        } else {
          res.redirect('/signupFailed');
        }
      })
      .catch((emailVerifyError) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to verify User via email.',
          emailVerifyError,
        };
        logger.log(returnObj);
        res.redirect('/signupFailed');
      });
  });

  app.get('/api/verifyUserEmail', (req, res) => {
    const { userID, email } = req.query;
    const decUserID = Buffer.from(userID, 'base64').toString();
    confirmUserViaEmail(decUserID, email)
      .then((response) => {
        if (response.success) {
          res.redirect('/signup/emailConfirm');
        } else {
          res.redirect('/signupFailed');
        }
      })
      .catch((emailVerifyError) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to verify User via email.',
          emailVerifyError,
        };
        logger.log(returnObj);
        res.redirect('/signupFailed');
      });
  });

  app.post('/api/updatePassword', (req, res) => {
    const { AuthToken } = req.cookies;
    updatePassword(req.body, AuthToken)
      .then((response) => {
        const { success } = response;
        if (success) {
          res.status(200).send(true);
        } else {
          res.status(400).send(false);
        }
      })
      .catch((err) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to update password.',
          err: err.message,
          toEmail: req.body.email,
        };
        logger.log(returnObj);
        res.status(400).send(err.message);
      });
  });

  app.post('/api/resetPassword', (req, res) => {
    resetPassword(req.body)
      .then((response) => {
        const { success, newPassword } = response;
        if (success && newPassword) {
          sendResetPasswordEmail(req.body.email, newPassword)
            .then((resEmail) => {
              res.status(200).send(resEmail);
            })
            .catch((sendVerificationErr) => {
              const returnObj = {
                level: LOG_LEVELS.ERROR,
                severity: STACKDRIVER_SEVERITY.ERROR,
                message: 'Failed to send verification email.',
                sendVerificationErr,
                toEmail: req.body.email,
              };
              logger.log(returnObj);
              res.status(400).send(returnObj);
            });
        } else {
          res.status(400).send(false);
        }
      })
      .catch((err) => {
        const returnObj = {
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Failed to reset password.',
          err: err.message,
          toEmail: req.body.email,
        };
        logger.log(returnObj);
        res.status(400).send(err.message);
      });
  });

  // this endpoint is to send email for confirmation of email address
  app.post('/api/sendConfirmation', (req, res) => {
    sendSubscriptionConfirmationEmail(req, res);
  });

  app.get('/api/confirmEmail', (req, res) => {
    logger.log({ level: 'info', message: req.query });

    handleSubscriptionConfirmation(req, res);
  });
};
