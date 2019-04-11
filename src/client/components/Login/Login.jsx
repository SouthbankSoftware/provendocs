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
import { Link } from 'react-router-dom';
import GoogleIcon from '../../style/icons/pages/login-signup-pages/google-icon.svg';
import GithubIcon from '../../style/icons/pages/login-signup-pages/github-icon.svg';
// import MicrosoftIcon from '../../style/icons/pages/login-signup-pages/microsoft-icon.svg';
// import FacebookIcon from '../../style/icons/pages/login-signup-pages/facebook-icon.svg';

import { DOMAINS, GA_CATEGORIES } from '../../common/constants';

type Props = {};
type State = {};

export default class Login extends React.Component<Props, State> {
  componentWillMount() {}

  componentDidMount() {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

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
          <a
            className=" oAuthButton googleButton button"
            href={`${apiLoginURL}google`}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.LOGIN,
                action: 'Log in with Google',
                label: 'Button',
              });
            }}
          >
            <div className="button-text">
              <div className="icon googleIcon">
                <GoogleIcon />
              </div>
              <div className="vr" />
              <span>Log in with Google</span>
            </div>
          </a>
          <a
            className=" oAuthButton githubButton button"
            href={`${apiLoginURL}github`}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.LOGIN,
                action: 'Log in with Github',
                label: 'Button',
              });
            }}
          >
            <div className="button-text">
              <div className="icon githubIcon">
                <GithubIcon />
              </div>
              <div className="vr" />
              <span>Log in with Github</span>
            </div>
          </a>
          {/* Removed until support is added.
          <a className=" oAuthButton microsoftButton button" href="/auth/microsoft" onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.LOGIN,
                action: 'Log in with Microsoft',
                label: 'Button',
              });
            }}>
            <div className="button-text">
              <div className="icon microsoftIcon">
                <MicrosoftIcon />
              </div>
              <div className="vr" />
              <span>Log in with Microsoft</span>
            </div>
          </a>
          <a className=" oAuthButton facebookButton button" href="/auth/facebook" onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.LOGIN,
                action: 'Log in with Facebook',
                label: 'Button',
              });
            }}>
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
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.LOGIN,
                action: 'Log in with Email',
                label: 'Button',
              });
            }}
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
