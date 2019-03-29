/*
 * Created Date: Wednesday September 19th 2018
 * Author: Michael Harrison
 * -----
 * Last Modified: Wednesday September 19th 2018 9:58:26 am
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 * -----
 *
 */
import winston from 'winston';
// eslint-disable-next-line
import colors from 'colors';
import { ENV_TYPES } from '../common/constants';

const LOG_TYPE = process.env.PROVENDOCS_LOG_TYPE || ENV_TYPES.PROD;

let baseFormat;
if (LOG_TYPE === ENV_TYPES.PROD) {
  baseFormat = winston.format.combine(winston.format.timestamp());
} else {
  baseFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp(),
    winston.format.align(),
  );
}

const newWinstonFormat = (sectionLabel: string, colorizedLabel: any) => winston.format.combine(
  baseFormat,
  LOG_TYPE === ENV_TYPES.PROD
    ? winston.format.label({ label: sectionLabel })
    : winston.format.label({ label: colorizedLabel }),
  winston.format.printf((info) => {
    const {
      timestamp, level, message, code, label, severity, ...args
    } = info;

    const ts = timestamp.slice(0, 19).replace('T', ' ');
    if (LOG_TYPE === ENV_TYPES.PROD) {
      return `{"code": ${code
          || '"none"'}, "severity": "${severity}", "message": "${message}", "ts": "${ts}", "label": "${label}", "level": "${level}", "args": ${
        Object.keys(args).length ? JSON.stringify(args, null, null) : '"none"'
      }}`;
    }
    return `${ts.yellow} - [${label}] - [${level}]: ${message} \n${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
    }`;
  }),
);

export const routingLogFormat = newWinstonFormat('ROUTE', 'ROUTE'.magenta);
export const sendgridAPIFormat = newWinstonFormat('SENDGRID', 'SENDGRID'.blue);
export const mongoAPIFormat = newWinstonFormat('MONGO', 'MONGO'.green);
export const fileAPIFormat = newWinstonFormat('FILE', 'FILE'.blue);
export const certificateAPIFormat = newWinstonFormat('CERTIFICATE', 'CERTIFICATE'.yellow);
export const generalFormat = newWinstonFormat('GENERAL', 'GENERAL'.white);
export const authFormat = newWinstonFormat('AUTHENTICATION', 'AUTHENTICATION'.cyan);
