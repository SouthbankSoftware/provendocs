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
import { withRouter, Redirect } from 'react-router';
import {
  Register,
  RegisterSuccess,
  RegisterFailed,
  EmailSignup,
  EmailSignupSuccess,
  EmailConfirmed,
  EmailResend,
  EmailResendSuccess,
} from '../Register';
import { TopNavBar, Footer } from '../index';
import { PAGES } from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
// $FlowFixMe
import './LoginSignup.scss';

type State = { loggedIn: boolean };
type Props = {
  signedUp: boolean;
  // eslint-disable-next-line
  eulaOpen: boolean;
  // eslint-disable-next-line
  securityOpen: boolean;
  signUpFailed: boolean;
  history: any;
  location: any;
  match: any;
};
class RegisterationPage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      loggedIn: false,
    };
  }

  componentWillMount() {
    const { loggedIn } = this.state;
    checkAuthentication()
      .then((response: Object) => {
        if (response.status === 200 && loggedIn !== true) {
          this.setState({ loggedIn: true });
        } else if (response.response.status === 400 && loggedIn !== false) {
          this.setState({ loggedIn: false });
        }
      })
      .catch((err) => {
        if (err.response.status === 400 && loggedIn !== false) {
          // Invalid Token, log in again.
          this.setState({ loggedIn: false });
        }
      });
  }

  componentDidMount() {}

  componentWillReceiveProps() {}

  handleLogoClick = () => {
    const { history } = this.props;
    history.push('/');
  };

  render() {
    const {
      location: { pathname },
      match: { path },
    } = this.props;

    let page = 'default';
    const pagePath = pathname.replace(path, '').replace(/\//g, '');
    if (pagePath !== '') {
      page = pagePath;
    }
    const { loggedIn } = this.state;
    const { signedUp, signUpFailed } = this.props;
    if (signedUp || signUpFailed) {
      page = 'none';
    }
    if (loggedIn) {
      return <Redirect to="/dashboard" />;
    }

    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.REGISTER} isAuthenticated={loggedIn} />
        <div className="AppBody">
          <div className="mainPanel">
            <div className="loginSignupRoot">
              {signedUp && <RegisterSuccess />}
              {signUpFailed && <RegisterFailed />}
              {page === 'default' && <Register pageProps={this.props} />}
              {page === 'email' && <EmailSignup />}
              {page === 'emailSuccess' && <EmailSignupSuccess />}
              {page === 'emailConfirm' && <EmailConfirmed />}
              {page === 'emailResend' && <EmailResend />}
              {page === 'emailResendSuccess' && <EmailResendSuccess />}
            </div>
          </div>
        </div>
        <Footer currentPage={PAGES.HOME} />
      </div>
    );
  }
}

export default withRouter(RegisterationPage);
