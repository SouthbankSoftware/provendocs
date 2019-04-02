/* @flow
 * Created Date: Monday July 30th 2018
 * Author: Michael Harrison
 * Last Modified: Friday October 5th 2018 1:26:33 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
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
