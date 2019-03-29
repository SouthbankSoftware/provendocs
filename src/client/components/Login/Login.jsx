/*
 * @flow
 * Created Date: Tuesday July 31st 2018
 * Author: Michael Harrison
 * Last Modified: Friday September 14th 2018 8:52:58 am
 * Modified By: Wahaj Shamim at <wahaj@Southbanksoftware.com>
 */

import React from 'react';
import { Link } from 'react-router-dom';
import GoogleIcon from '../../style/icons/pages/login-signup-pages/google-icon.svg';
import GithubIcon from '../../style/icons/pages/login-signup-pages/github-icon.svg';
// import MicrosoftIcon from '../../style/icons/pages/login-signup-pages/microsoft-icon.svg';
// import FacebookIcon from '../../style/icons/pages/login-signup-pages/facebook-icon.svg';

import { DOMAINS } from '../../common/constants';

type Props = {};
type State = {};

export default class Login extends React.Component<Props, State> {
  componentWillMount() {}

  componentDidMount() {}

  render() {
    const apiLoginURL = `${DOMAINS.API}/auth/login?redirectURL=${
      DOMAINS.PROVENDOCS
    }/api/login&provider=`;

    return (
      <div className="pageCenter">
        <div className="pageMessage">
          <span className="sectionTitle">Log In</span>
          <span className="sectionText">Hello there! Log in to start proving.</span>
        </div>

        <div className="pageOptions">
          <a className=" oAuthButton googleButton button" href={`${apiLoginURL}google`}>
            <div className="button-text">
              <div className="icon googleIcon">
                <GoogleIcon />
              </div>
              <div className="vr" />
              <span>Log in with Google</span>
            </div>
          </a>
          <a className=" oAuthButton githubButton button" href={`${apiLoginURL}github`}>
            <div className="button-text">
              <div className="icon githubIcon">
                <GithubIcon />
              </div>
              <div className="vr" />
              <span>Log in with Github</span>
            </div>
          </a>
          {/* Removed until support is added.
          <a className=" oAuthButton microsoftButton button" href="/auth/microsoft">
            <div className="button-text">
              <div className="icon microsoftIcon">
                <MicrosoftIcon />
              </div>
              <div className="vr" />
              <span>Log in with Microsoft</span>
            </div>
          </a>
          <a className=" oAuthButton facebookButton button" href="/auth/facebook">
            <div className="button-text">
              <div className="icon facebookIcon">
                <FacebookIcon />
              </div>
              <div className="vr" />
              <span>Log in with Facebook</span>
            </div>
          </a> */}
          <Link
            className=" oAuthButton emailButton button"
            to={{ pathname: '/login/email', search: '' }}
            style={{ textDecoration: 'none' }}
          >
            <div className="button-text">
              <span>Log in with Email</span>
            </div>
          </Link>

          <div className="footerLinks">
            <Link to={{ pathname: '/signup', search: '' }} style={{ textDecoration: 'none' }}>
              <span className="linkSpan">Sign up instead?</span>
            </Link>
            <br />
          </div>
        </div>
      </div>
    );
  }
}
