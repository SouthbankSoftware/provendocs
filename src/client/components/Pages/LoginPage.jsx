/*
 * @flow
 * Created Date: Monday July 30th 2018
 * Author: Michael Harrison
 * Last Modified: Friday August 31st 2018 3:24:14 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
import React from 'react';
import { withRouter, Redirect } from 'react-router';
import {
  ResetPasswordSuccess,
  ResetPassword,
  EmailLogin,
  LoginFailed,
  Login,
} from '../Login/index';
import { Footer, TopNavBar } from '../index';
import { PAGES } from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
// $FlowFixMe
import './LoginSignup.scss';

type Props = {
  location: any;
  match: any;
  history: any;
  failedLogin: boolean;
};
type State = { loggedIn: boolean };
class LoginPage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      loggedIn: false,
    };
  }

  componentWillMount() {
    checkAuthentication()
      // $FlowFixMe
      .then((response: Object) => {
        if (response.status === 200) {
          this.setState({ loggedIn: true });
        } else if (response.response.status === 400) {
          this.setState({ loggedIn: false });
        }
      })
      .catch((err) => {
        if (err.response.status === 400) {
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
    const { failedLogin } = this.props;
    if (failedLogin) {
      page = 'none';
    }
    if (loggedIn) {
      return <Redirect to="/dashboard" />;
    }

    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.LOGIN} isAuthenticated={loggedIn} />
        <div className="AppBody">
          <div className="mainPanel">
            <div className="loginSignupRoot">
              {failedLogin && <LoginFailed />}
              {page === 'default' && <Login pageProps={this.props} />}
              {page === 'email' && <EmailLogin />}
              {page === 'forgot' && <ResetPassword />}
              {page === 'resetSuccess' && <ResetPasswordSuccess />}
              {page === 'expired' && <Login pageProps={this.props} />}
            </div>
          </div>
        </div>
        <Footer currentPage={PAGES.HOME} />
      </div>
    );
  }
}

export default withRouter(LoginPage);
