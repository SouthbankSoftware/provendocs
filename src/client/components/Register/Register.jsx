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
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import ReactGA from 'react-ga';
import { Link } from 'react-router-dom';
import { Modal } from 'antd';
import { EULA } from '../index';
import { DOMAINS, GA_CATEGORIES } from '../../common/constants';

import GoogleIcon from '../../style/icons/pages/login-signup-pages/google-icon.svg';
import GithubIcon from '../../style/icons/pages/login-signup-pages/github-icon.svg';
// import MicrosoftIcon from '../../style/icons/pages/login-signup-pages/microsoft-icon.svg';
import FacebookIcon from '../../style/icons/pages/login-signup-pages/facebook-icon.svg';

type Props = {
  pageProps: Object;
};
type State = {
  eulaIsOpen: boolean;
};
const { confirm } = Modal;

export default class Login extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      eulaIsOpen: false,
    };
  }

  componentDidMount() {
    ReactGA.pageview(window.location.pathname + window.location.search);
    const {
      pageProps: { eulaIsOpen },
    } = this.props;
    if (eulaIsOpen) {
      this.setState({ eulaIsOpen: true });
    } else {
      confirm({
        className: 'confirmEULA',
        title: 'End User License Agreement (EULA)',
        content:
          'By registering as a ProvenDocs user, you are agreeing to all terms and conditions of our End User License Agreement. You can view the agreement by clicking the button below or navigating to https://provendocs.com/eula',
        okText: 'View Agreement',
        cancelText: 'Okay.',
        onOk: this.handleOkModal,
      });
    }
  }

  handleOkModal = () => {
    this.setState({ eulaIsOpen: true });
  };

  render() {
    const { eulaIsOpen } = this.state;
    const apiLoginURL = `${DOMAINS.API}/auth/signup?redirectURL=${
      DOMAINS.PROVENDOCS
    }/api/signup&app=provendocs&provider=`;
    return (
      <div className="loginSignupRoot">
        <Modal
          visible={eulaIsOpen}
          className="modal privacyModal"
          centered
          footer={null}
          onCancel={() => {
            this.setState({ eulaIsOpen: false });
          }}
        >
          <EULA />
        </Modal>
        <div className="pageCenter">
          <div className="pageMessage">
            <span className="sectionTitle">Sign Up</span>
            <span className="sectionText">Create your free account. No credit card required.</span>
          </div>
          <a
            className=" oAuthButton googleButton button"
            href={`${apiLoginURL}google`}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.REGISTER,
                action: 'Sign up with Google',
                label: 'Button',
              });
            }}
          >
            <div className="button-text">
              <div className="icon googleIcon">
                <GoogleIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Google</span>
            </div>
          </a>
          <a
            className=" oAuthButton githubButton button"
            href={`${apiLoginURL}github`}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.REGISTER,
                action: 'Sign up with Github',
                label: 'Button',
              });
            }}
          >
            <div className="button-text">
              <div className="icon githubIcon">
                <GithubIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Github</span>
            </div>
          </a>
          {/* Removed until support is ready.
           <a className=" oAuthButton microsoftButton button" href="/signup/microsoft" onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.REGISTER,
                action: 'Sign up with Microsoft',
                label: 'Button',
              });
            }}>
            <div className="button-text">
              <div className="icon microsoftIcon">
                <MicrosoftIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Microsoft</span>
            </div>
          </a> */}
          <a
            className=" oAuthButton facebookButton button"
            href={`${apiLoginURL}facebook`}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.REGISTER,
                action: 'Sign up with Facebook',
                label: 'Button',
              });
            }}
          >
            <div className="button-text">
              <div className="icon facebookIcon">
                <FacebookIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Facebook</span>
            </div>
          </a>
          <Link
            to={{ pathname: '/signup/email', search: '' }}
            className="oAuthButton emailButton button"
            style={{ textDecoration: 'none' }}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.REGISTER,
                action: 'Sign up with Email',
                label: 'Button',
              });
            }}
          >
            <div className="button-text">
              <span className="linkSpan">Sign up with Email</span>
            </div>
          </Link>
          <div className="footerLinks">
            <span className="footerText">Already have an account?</span>
            <div className="vr" />
            <Link to={{ pathname: '/login', search: '' }} style={{ textDecoration: 'none' }}>
              <span className="linkSpan">Log In</span>
            </Link>
            <div className="vr" />
            <Link to={{ pathname: '', search: '' }} style={{ textDecoration: 'none' }}>
              <span
                className="linkSpan"
                onClick={() => {
                  this.setState({ eulaIsOpen: true });
                }}
              >
                EULA
              </span>
            </Link>
            <br />
          </div>
        </div>
      </div>
    );
  }
}
