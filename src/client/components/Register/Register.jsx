/*
 * @flow
 * Created Date: Monday August 6th 2018
 * Last Modified: Friday August 31st 2018 3:24:14 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'antd';
import { EULA, Security } from '../index';
import { DOMAINS } from '../../common/constants';

import GoogleIcon from '../../style/icons/pages/login-signup-pages/google-icon.svg';
import GithubIcon from '../../style/icons/pages/login-signup-pages/github-icon.svg';
// import MicrosoftIcon from '../../style/icons/pages/login-signup-pages/microsoft-icon.svg';
// import FacebookIcon from '../../style/icons/pages/login-signup-pages/facebook-icon.svg';

type Props = {
  pageProps: Object;
};
type State = {
  eulaIsOpen: boolean;
  securityIsOpen: boolean;
};
const { confirm } = Modal;

export default class Login extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      eulaIsOpen: false,
      securityIsOpen: false,
    };
  }

  componentDidMount() {
    const { eulaOpen, securityOpen } = this.props.pageProps;
    if (eulaOpen) {
      this.setState({ eulaIsOpen: true });
    } else if (securityOpen) {
      this.setState({ securityIsOpen: true });
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
    const { eulaIsOpen, securityIsOpen } = this.state;
    const apiLoginURL = `${DOMAINS.API}/auth/signup?redirectURL=${
      DOMAINS.PROVENDOCS
    }/api/signup&provider=`;
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
        <Modal
          visible={securityIsOpen}
          className="modal privacyModal"
          centered
          footer={null}
          onCancel={() => {
            this.setState({ securityIsOpen: false });
          }}
        >
          <Security />
        </Modal>
        <div className="pageCenter">
          <div className="pageMessage">
            <span className="sectionTitle">Sign Up</span>
            <span className="sectionText">Create your free account. No credit card required.</span>
          </div>
          <a className=" oAuthButton googleButton button" href={`${apiLoginURL}google`}>
            <div className="button-text">
              <div className="icon googleIcon">
                <GoogleIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Google</span>
            </div>
          </a>
          <a className=" oAuthButton githubButton button" href={`${apiLoginURL}github`}>
            <div className="button-text">
              <div className="icon githubIcon">
                <GithubIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Github</span>
            </div>
          </a>
          {/* Removed until support is ready.
           <a className=" oAuthButton microsoftButton button" href="/signup/microsoft">
            <div className="button-text">
              <div className="icon microsoftIcon">
                <MicrosoftIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Microsoft</span>
            </div>
          </a>
          <a className=" oAuthButton facebookButton button" href="/signup/facebook">
            <div className="button-text">
              <div className="icon facebookIcon">
                <FacebookIcon />
              </div>
              <div className="vr" />
              <span>Sign up with Facebook</span>
            </div>
          </a> */}
          <Link
            to={{ pathname: '/signup/email', search: '' }}
            className="oAuthButton emailButton button"
            style={{ textDecoration: 'none' }}
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
