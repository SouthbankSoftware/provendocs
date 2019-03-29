/* @flow
 * Created Date: Monday July 30th 2018
 * Author: Michael Harrison
 * Last Modified: Friday October 5th 2018 1:26:33 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import LandingPage from '../components/Pages/Landing';
import NotFound from '../components/Pages/Status/404';
import FailPage from '../components/Pages/Status/503';
// $FlowFixMe
import '../style/global_styles.scss';

const Routes = () => (
  <Switch>
    <Route exact path="/" component={LandingPage} />
    <Route path="/landing" component={LandingPage} />
    <Route path="/landing/:page" component={LandingPage} />
    <Route path="/dashboard" component={FailPage} />
    <Route exact path="/login" component={FailPage} />
    <Route exact path="/loginFailed" component={FailPage} />
    <Route exact path="/signup" component={FailPage} />
    <Route exact path="/signupFailed" component={FailPage} />
    <Route exact path="/signupSucceeded" component={FailPage} />
    <Route path="*" component={NotFound} />
  </Switch>
);
export default Routes;
