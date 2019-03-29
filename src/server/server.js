/*
 * Server file containing Express Configuration and Route list.
 * @flow
 * Created Date: Monday July 30th 2018
 * Author: Michael Harrison
 * -----
 * Last Modified: Wednesday September 19th 2018 9:51:25 am
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 * -----
 *
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
          sharedSecret: process.env.PROVENDOCS_SECRET || 'Undefined',
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
