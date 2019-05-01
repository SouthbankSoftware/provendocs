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

import React from 'react';
import ReactGA from 'react-ga';
import ReactDOM from 'react-dom';
import IEPage from './components/Pages/Status/IERedirect';
import App from './App';

import { ENVIRONMENT, DOMAINS } from './common/constants';
import { api } from './common';

const googleAnalytics = {
  gaOptions: { cookieDomain: 'auto' },
};

const isIE = /* @cc_on!@ */ false || !!document.documentMode;
if (isIE) {
  ReactGA.initialize('UA-101162043-7', googleAnalytics);
  ReactDOM.render(<IEPage />, document.getElementById('root'));
} else {
  api
    .getServiceUrls()
    .then((res) => {
      if (res.data.PROVENDOCS_ENV) {
        DOMAINS.PROVENDOCS_ENV = res.data.PROVENDOCS_ENV;
      }
      switch (res.data.PROVENDOCS_ENV || DOMAINS.PROVENDOCS_ENV) {
        case ENVIRONMENT.PROD:
          ReactGA.initialize('UA-101162043-7', googleAnalytics);
          break;
        case ENVIRONMENT.DEV:
          googleAnalytics.debug = true;
          ReactGA.initialize('UA-101162043-10', googleAnalytics);
          break;
        case ENVIRONMENT.STAGING:
          googleAnalytics.debug = true;
          ReactGA.initialize('UA-101162043-11', googleAnalytics);
          break;
        case ENVIRONMENT.TEST:
          googleAnalytics.debug = true;
          ReactGA.initialize('UA-101162043-12', googleAnalytics);
          break;
        default:
          ReactGA.initialize('UA-101162043-7', googleAnalytics);
          break;
      }

      ReactDOM.render(<App />, document.getElementById('root'));
    })
    .catch((getServiceUrlsErr) => {
      console.error(getServiceUrlsErr);
    });
}
