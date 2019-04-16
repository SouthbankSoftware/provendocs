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
 * @Date:   2018-11-23T15:00:28+11:00
 * @Last modified by:   wahaj
 * @Last modified time: 2019-04-10T14:44:37+10:00
 */

// eslint no-return-assign:0
import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import NotFound from '../components/Pages/Status/404';
import {
  SharedDocument,
  Dashboard,
  HomePage,
  RegistrationPage,
  LoginPage,
  LandingPage,
  Downloads,
} from '../components/Pages';
import '../style/global_styles.scss';

const Routes = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route exact path="/subscribe" component={() => <HomePage subscribe />} />
      <Route exact path="/logout" component={HomePage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/landing/:page" component={LandingPage} />
      <Route path="/dashboard/" component={Dashboard} />
      <Route path="/home/" component={Dashboard} />
      <Route path="/downloads/" component={Downloads} />
      <Route path="/privacy" component={() => <HomePage privacyOpen />} />
      <Route path="/eula" component={() => <RegistrationPage eulaIsOpen />} />
      <Route path="/security" component={() => <RegistrationPage securityIsOpen />} />
      <Route path="/share/:link" component={SharedDocument} />
      <Route path="/login" component={LoginPage} />
      <Route path="/login/:page" component={LoginPage} />
      <Route exact path="/loginFailed" component={() => <LoginPage failedLogin />} />
      <Route path="/signup" component={RegistrationPage} />
      <Route path="/signup/:page" component={RegistrationPage} />
      <Route exact path="/signupFailed" component={() => <RegistrationPage signUpFailed />} />
      <Route exact path="/signupSuccess" component={() => <LoginPage signedUp />} />
      <Route path="*" component={NotFound} />
    </Switch>
  </BrowserRouter>
);
export default Routes;
