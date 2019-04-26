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

import express from 'express';
import path from 'path';
import winston from 'winston';
import expressWinston from 'express-winston';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { LOG_LEVELS, STACKDRIVER_SEVERITY } from './common/constants';
import { routingLogFormat, generalFormat } from './modules/winston.config';

const expressSession = require('express-session');
const { MongoClient } = require('mongodb');
const swaggerDocument = require('./swagger.json');

const app = express();
const jwtSecret = process.env.JWT_SECRET || 'provendbjwtsecret';
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
      json: true,
      colorize: true,
      format: generalFormat,
    }),
  ],
});

// Initial check to make sure we can connect to Mongodb.

MongoClient.connect(process.env.PROVENDOCS_URI, {
  useNewUrlParser: true,
  poolSize: 1,
  ssl: true,
  sslValidate: false,
})
  .then(() => {
    logger.log({
      level: LOG_LEVELS.INFO,
      severity: STACKDRIVER_SEVERITY.INFO,
      message: 'ProvenDocs is now connected to ProvenDB and running.',
      config: {
        provendocs: {
          runningOnPort: process.env.PROVENDOCS_PORT || '8888 (default)',
          logLevel: process.env.PROVENDOCS_LOG_LEVEL || 'debug (default)',
          pDocsEnv: process.env.PROVENDOCS_ENV || 'dev (default)',
          signupEnv: process.env.SIGNUP_ENV,
          nodeEnv: process.env.NODE_ENV,
          encryptionKey: process.env.PROVENDOCS_CRYPT_KEY || 'Undefined',
          sharedSecret: process.env.PROVENDOCS_SECRET || 'Undefined',
          growsurfSecret: process.env.PROVENDOCS_CRYPT_KEY || 'Undefined',
        },
        provendb: {
          uri: process.env.PROVENDOCS_URI,
          sslEnabled: process.env.PROVENDOCS_SSL_ENABLED || 'true (default)',
          proofDebounce: process.env.PROVENDOCS_PROOF_DEBOUNCE || '300000 (default)',
        },
      },
    });
  })
  .catch(error => logger.log({
    level: LOG_LEVELS.ERROR,
    severity: STACKDRIVER_SEVERITY.CRITICAL,
    message: 'Failed to connect to MongoDB on launch.',
    error,
  }));

// Express Config.
app.set('jwtSecret', jwtSecret);
app.use(express.static(path.join(__dirname, './public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console({
        level: process.env.PROVENDOCS_LOG_LEVEL || 'debug',
        json: true,
        colorize: true,
        format: routingLogFormat,
      }),
    ],
  }),
);
app.use(cookieParser()); // read cookies (needed for auth)
app.use(expressSession({ secret: 'mySecretKey' }));
app.use(bodyParser.json({ limit: '1600kb' }));
app.use(bodyParser.urlencoded({ limit: '1600kb', extended: true }));
app.use(bodyParser.raw());
app.use(bodyParser.text());

// API Routes.
require('./routes/authRoutes.js')(app);
require('./routes/utilRoutes.js')(app);
require('./routes/fileRoutes.js')(app);
require('./routes/uploadRoutes.js')(app);
require('./routes/proofRoutes.js')(app);
require('./routes/shareRoutes.js')(app);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});
module.exports = app;
