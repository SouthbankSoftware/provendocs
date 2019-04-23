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
// eslint-disable-next-line
import colors from 'colors';
import { ENVIRONMENTS } from '../common/constants';

const LOG_TYPE = process.env.PROVENDOCS_LOG_TYPE || ENVIRONMENTS.PROD;

let baseFormat;
if (LOG_TYPE === ENVIRONMENTS.PROD) {
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
  LOG_TYPE === ENVIRONMENTS.PROD
    ? winston.format.label({ label: sectionLabel })
    : winston.format.label({ label: colorizedLabel }),
  winston.format.printf((info) => {
    const {
      timestamp, level, message, code, label, severity, ...args
    } = info;

    const ts = timestamp.slice(0, 19).replace('T', ' ');
    if (LOG_TYPE === ENVIRONMENTS.PROD) {
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
