/* @flow
 * @Author: Michael Harrison
 * @Date:   2019-03-22T13:19:54+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:56:26+11:00
 */

import React from 'react';
import { Modal, Button } from 'antd';
import { Privacy } from '../index';
import { PAGES } from '../../common/constants';
import FacebookIcon from '../../style/icons/pages/landing-page/social-icons/facebook-icon.svg';
import TwitterIcon from '../../style/icons/pages/landing-page/social-icons/twitter-icon.svg';
import GithubIcon from '../../style/icons/pages/landing-page/social-icons/github-icon-2.svg';
import LinkedinIcon from '../../style/icons/pages/landing-page/social-icons/linkedin-icon.svg';
import MediumIcon from '../../style/icons/pages/landing-page/social-icons/medium-icon.svg';
import YoutubeIcon from '../../style/icons/pages/landing-page/social-icons/youtube-icon.svg';
// $FlowFixMe
import './Footer.scss';

type State = { privacyOpen: boolean };

type Props = { currentPage: String; privacyOpen: boolean };
export default class Footer extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      // eslint-disable-next-line
      privacyOpen: false,
    };
  }

  componentDidMount() {}

  componentWillReceiveProps() {
    const { privacyOpen } = this.props;
    if (privacyOpen) {
      this.setState({ privacyOpen });
    }
  }

  render() {
    const { currentPage } = this.props;
    const { privacyOpen } = this.state;
    if (currentPage === PAGES.HOME) {
      return (
        <React.Fragment>
          <div className="footerRoot home">
            <Modal
              visible={privacyOpen}
              className="modal privacyModal"
              centered
              footer={null}
              onCancel={() => {
                this.setState({ privacyOpen: false });
              }}
            >
              <Privacy />
            </Modal>
            <div className="spacer" />
            <div className="centerContent">
              <span className="copyright">
                &copy; 2019 Southbank Software. All rights reserved.
              </span>
            </div>

            <Button
              className="privacyLink"
              type="normal"
              role="button"
              onClick={() => {
                this.setState({ privacyOpen: true });
              }}
              style={{ textDecoration: 'none' }}
            >
              <span className="privacy">Privacy Policy</span>
            </Button>
          </div>
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <div className="hr" />
        <div className="footerRoot light">
          <Modal
            visible={privacyOpen}
            className="modal privacyModal"
            centered
            footer={null}
            onCancel={() => {
              this.setState({ privacyOpen: false });
            }}
          >
            <Privacy />
          </Modal>
          <div className="spacer" />
          <div className="centerContent">
            <div className="socialLinks">
              <a
                href="https://www.facebook.com/ProvenDB"
                className="facebookLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.linkedin.com/company/provendb"
                className="linkedinLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinIcon />
              </a>
              <a
                href="https://twitter.com/provendb"
                className="twitterLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterIcon />
              </a>
              <a
                href="https://github.com/southbankSoftware/provendocs"
                className="githubLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon />
              </a>
              <a
                href="https://medium.com/provendb"
                className="mediumLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MediumIcon />
              </a>
              <a
                href="https://www.youtube.com/channel/UCHU81AKOjYEEWE2bcmeF6hw"
                className="youtubeLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <YoutubeIcon />
              </a>
            </div>
            <span className="copyright">&copy; 2019 Southbank Software. All rights reserved.</span>
          </div>

          <Button
            className="privacyLink"
            type="normal"
            role="button"
            onClick={() => {
              this.setState({ privacyOpen: true });
            }}
            style={{ textDecoration: 'none' }}
          >
            <span className="privacy">Privacy Policy</span>
          </Button>
        </div>
      </React.Fragment>
    );
  }
}
