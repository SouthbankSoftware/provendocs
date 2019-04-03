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
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import HomePage from '../components/Pages/HomePage';
import NotFound from '../components/Pages/Status/404';
import FailPage from '../components/Pages/Status/503';
// $FlowFixMe
import '../style/global_styles.scss';

const Routes = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/landing" component={HomePage} />
      <Route path="/landing/:page" component={HomePage} />
      <Route path="/dashboard" component={FailPage} />
      <Route exact path="/login" component={FailPage} />
      <Route exact path="/loginFailed" component={FailPage} />
      <Route exact path="/signup" component={FailPage} />
      <Route exact path="/signupFailed" component={FailPage} />
      <Route exact path="/signupSucceeded" component={FailPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  </BrowserRouter>
);
export default Routes;
