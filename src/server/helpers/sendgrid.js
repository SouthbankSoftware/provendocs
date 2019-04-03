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
 *
 * Followed this blog for this implementation
 * https://sendgrid.com/blog/creating-a-subscription-widget-with-node-js/
 */
import winston from 'winston';
import { sendgridAPIFormat } from '../modules/winston.config';
import { LOG_LEVELS, STACKDRIVER_SEVERITY } from '../common/constants';

const sg = require('sendgrid')(process.env.PROVENDOCS_SG_API_KEY);
const Settings = require('../config/sendgrid.js');

sg.globalRequest.headers['User-Agent'] = 'subscription-widget/1.0.0';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.PROVENDOCS_LOG_LEVEL || LOG_LEVELS.DEBUG,
      json: true,
      colorize: true,
      format: sendgridAPIFormat,
    }),
  ],
});

function prepareSharedFileEmail(
  toEmail: string,
  fromEmail: string,
  fromName: string,
  fileName: string,
  fileLink: string,
) {
  // eslint-disable-next-line
  const template_id = Settings.templates.SHARED_PROOF_TEMPLATE;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          toEmail,
          fromEmail,
          fileName,
          fromName,
          viewlink: fileLink,
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };

  return emailBody;
}

export function sendSharedFileEmail(
  toEmail: string,
  fromEmail: string,
  fromName: string,
  fileName: string,
  fileLink: string,
) {
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareSharedFileEmail(toEmail, fromEmail, fromName, fileName, fileLink),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending shared file email ',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
        // res.sendFile(path.join(__dirname, '../static/check-inbox.html'));
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
        // res.sendFile(path.join(__dirname, '../static/error.html'));
      }
    });
  });
}

function prepareWelcomeToProvenDocsEmail(toEmail: string) {
  // eslint-disable-next-line
  const template_id = Settings.templates.WELCOME_TO_PROVENDOCS;

  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {},
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };
  return emailBody;
}
export function sendWelcomeToProvenDocsEmail(toEmail: string) {
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareWelcomeToProvenDocsEmail(toEmail),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending welcome to provendocs email',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
        // res.sendFile(path.join(__dirname, '../static/check-inbox.html'));
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
        // res.sendFile(path.join(__dirname, '../static/error.html'));
      }
    });
  });
}

function prepareEmailUploadPassedEmail(toEmail: string, subject: string, numAttach: string) {
  // eslint-disable-next-line
  const template_id = Settings.templates.EMAIL_UPLOAD_SUCCEEDED;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          subject,
          numAttachments: numAttach,
        },
        custom_args: {
          type: 'opt-in',
          subject: 'This is an email subject!',
          time_sent: String(Date.now()),
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };

  // Object.assign(emailBody.personalizations[0].custom_args, reqBody);

  return emailBody;
}
export function sendEmailUploadPassedEmail(toEmail: string, subject: string, numAttach: string) {
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareEmailUploadPassedEmail(toEmail, subject, numAttach),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending upload passed email',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
        // res.sendFile(path.join(__dirname, '../static/check-inbox.html'));
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
        // res.sendFile(path.join(__dirname, '../static/error.html'));
      }
    });
  });
}

function prepareEmailUploadFailedEmail(toEmail: string, subject: string, numAttach: string) {
  // eslint-disable-next-line
  const template_id = Settings.templates.EMAIL_UPLOAD_FAILED;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          subject,
          numAttachments: numAttach,
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };
  return emailBody;
}
export function sendEmailUploadFailedEmail(toEmail: string, subject: string, numAttach: string) {
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareEmailUploadFailedEmail(toEmail, subject, numAttach),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending upload failed email',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
        // res.sendFile(path.join(__dirname, '../static/check-inbox.html'));
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
        // res.sendFile(path.join(__dirname, '../static/error.html'));
      }
    });
  });
}

function prepareEmailUploadNoAccountEmail(toEmail: string, subject: string) {
  // eslint-disable-next-line
  const template_id = Settings.templates.EMAIL_UPLOAD_NO_ACCOUNT_FOUND;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          subject,
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };
  return emailBody;
}
export function sendEmailUploadNoAccountEmail(toEmail: string, subject: string) {
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareEmailUploadNoAccountEmail(toEmail, subject),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending upload no account email',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
        // res.sendFile(path.join(__dirname, '../static/check-inbox.html'));
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
        // res.sendFile(path.join(__dirname, '../static/error.html'));
      }
    });
  });
}

function prepareEmailProofCopyEmail(
  toEmail: string,
  subject: string,
  binaryData: string,
  fileName: string,
  fromName: string,
  fromEmail: string,
) {
  // eslint-disable-next-line
  const template_id = Settings.templates.SEND_PROOF_COPY;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          fromName,
          fromEmail,
          subject,
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
    attachments: [
      {
        content: binaryData,
        disposition: 'attachment',
        filename: `${fileName}_proof.zip`,
        name: `${fileName}_proof.zip`,
        type: 'application/zip',
      },
    ],
  };
  return emailBody;
}

export function sendEmailProofCopyEmail(
  toEmail: string,
  subject: string,
  binaryData: string,
  fileName: string,
  fromName: string,
  fromEmail: string,
) {
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareEmailProofCopyEmail(toEmail, subject, binaryData, fileName, fromName, fromEmail),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending Proof Copy email',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
      }
    });
  });
}

function prepareVerificationEmail(toEmail: string, verifyLink: string) {
  // eslint-disable-next-line
  const template_id = Settings.templates.VERIFY_EMAIL;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          toEmail,
          verifyLink,
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };

  return emailBody;
}

export function sendVerificationEmail(toEmail: string, verifyLink: string) {
  logger.log({
    level: LOG_LEVELS.INFO,
    severity: STACKDRIVER_SEVERITY.INFO,
    message: 'sendVerificationEmail ',
    toEmail,
    verifyLink,
  });
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareVerificationEmail(toEmail, verifyLink),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending verification email ',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
      }
    });
  });
}

function prepareResetPasswordEmail(toEmail: string, newPassword: string) {
  // eslint-disable-next-line
  const template_id = Settings.templates.RESET_PASSWORD;
  const emailBody = {
    template_id,
    personalizations: [
      {
        to: [
          {
            email: toEmail,
          },
        ],
        dynamic_template_data: {
          newPassword,
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };

  return emailBody;
}

export function sendResetPasswordEmail(toEmail: string, newPassword: string) {
  logger.log({
    level: LOG_LEVELS.INFO,
    severity: STACKDRIVER_SEVERITY.INFO,
    message: 'sendResetPasswordEmail ',
    toEmail,
    newPassword,
  });
  return new Promise((resolve, reject) => {
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareResetPasswordEmail(toEmail, newPassword),
    });
    sg.API(request, (error, response) => {
      if (error) {
        logger.log({
          level: LOG_LEVELS.ERROR,
          severity: STACKDRIVER_SEVERITY.ERROR,
          message: 'Error response received while sending reset password email ',
          error,
        });
        reject(new Error(`Error from SendGrid API: ${error}`));
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolve(true);
      } else {
        reject(new Error(`Error from SendGrid API: ${response}`));
      }
    });
  });
}

function prepareSubscriptionConfirmationEmail(reqBody) {
  const firstName = reqBody.first_name ? reqBody.first_name : '';
  const lastName = reqBody.last_name ? reqBody.last_name : '';
  const url = `${Settings.url}/api/confirmEmail?email=${
    reqBody.email
  }&first_name=${firstName}&last_name=${lastName}`;

  const emailBody = {
    template_id: Settings.templates.CONFIRM_SUBSCRIPTION,
    personalizations: [
      {
        to: [
          {
            email: reqBody.email,
          },
        ],
        dynamic_template_data: {
          confirmUrl: url,
        },
        custom_args: {
          type: 'opt-in',
          time_sent: String(Date.now()),
        },
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };

  Object.assign(emailBody.personalizations[0].custom_args, reqBody);
  return emailBody;
}

export function sendSubscriptionConfirmationEmail(req: any, res: any) {
  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: prepareSubscriptionConfirmationEmail(req.body),
  });

  sg.API(request, (error, response) => {
    if (error) {
      logger.log({ level: 'error', message: 'Error response received' });
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });
}

function prepareSubscriptionThanksEmail(reqBody) {
  const emailBody = {
    template_id: Settings.templates.SUBSCRIPTION_THANKS,
    personalizations: [
      {
        to: [
          {
            email: reqBody.email,
          },
        ],
      },
    ],
    from: {
      email: Settings.senderEmail,
      name: Settings.senderName,
    },
  };

  return emailBody;
}

export function handleSubscriptionConfirmation(req: any, res: any) {
  const { listId } = Settings;
  const recipients = [{}];

  Object.keys(req.query).forEach((key) => {
    recipients[0][key] = req.query[key];
  });

  const reqPostRecipients = sg.emptyRequest({
    method: 'POST',
    path: '/v3/contactdb/recipients',
    body: recipients,
  });

  sg.API(reqPostRecipients, (error, response) => {
    if (error) {
      logger.log({ level: 'error', message: error });
    }

    logger.log({ level: 'info', message: response.statusCode });
    logger.log({ level: 'info', message: response.body });
    logger.log({ level: 'info', message: response.headers });

    if (listId) {
      const contactID = response.body.persisted_recipients[0];
      const reqAddToList = sg.emptyRequest({
        method: 'POST',
        path: `/v3/contactdb/lists/${listId}/recipients/${contactID}`,
        body: recipients,
      });
      sg.API(reqAddToList, (err, resList) => {
        if (err) {
          logger.log({ level: 'error', message: err });
        }

        logger.log({ level: 'info', message: resList.statusCode });
        logger.log({ level: 'info', message: resList.body });
        logger.log({ level: 'info', message: resList.headers });
      });
    }

    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: prepareSubscriptionThanksEmail(req.query),
    });

    sg.API(request, (errorNotify, responseNotify) => {
      if (errorNotify) {
        logger.log({ level: 'error', message: errorNotify });
        logger.log({ level: 'info', message: responseNotify.statusCode });
        logger.log({ level: 'info', message: responseNotify.body });
        logger.log({ level: 'info', message: responseNotify.headers });
      }

      res.redirect('/landing/thanks');
    });
  });
}
