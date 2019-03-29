/*
 * @flow
 * Created Date: Saturday September 29th 2018
 * Author: Michael Harrison
 * Last Modified: Tuesday October 9th 2018 9:54:52 am
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
import React from 'react';
import Markdown from 'react-markdown';
import CalenderIcon from '../../style/icons/pages/landing-page/calender-icon.svg';
import MailIcon from '../../style/icons/pages/landing-page/mail-icon.svg';
import UserIcon from '../../style/icons/pages/landing-page/user-icon.svg';
// $FlowFixMe
import './Privacy.scss';
// $FlowFixMe
import Eula from './EULA.md';

type State = {
  markdown: string;
};

type Props = {};

class EULA extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      markdown: '',
    };
  }

  componentDidMount() {
    this.setState({ markdown: Eula });
  }

  render() {
    const { markdown } = this.state;
    return (
      <div className="content">
        <div className="contentTop">
          <div className="left">
            <span className="title">End User License Agreement</span>
            <span className="subtitle">ProvenDocs Application and Provendocs.com</span>
            <span className="text">
              This end user license agreement (EULA) relates to the website provendocs.com and to
              the product “ProvenDocs” which is made licensed by Southbank Software under the Affero
              General Public License (AGPL) license.
              <br />
              <br />
              Please read our EULA carefully before registering for or using ProvenDocs.
            </span>
          </div>
          <div className="right">
            <span className="title one">Contacting Us</span>
            <span className="text one">
              If there are any questions regarding this EULA, you may contact us using the
              information below.
            </span>
            <span className="title two">Southbank Software</span>
            <span className="text two">Level 3, 20 Queen St Melbourne, VIC 3000</span>
            <div className="grid">
              <div className="row">
                <CalenderIcon />
                <span className="label">July 16th 2018 (last edited)</span>
              </div>
              <div className="row">
                <MailIcon />
                <span className="label">admin@southbanksoftware.com</span>
              </div>
              <div className="row">
                <UserIcon />
                <span className="label">Guy Harrison, CTO Southbank Software</span>
              </div>
            </div>
          </div>
        </div>
        <div className="contentBottom">
          <Markdown source={markdown} />
        </div>
      </div>
    );
  }
}

export default EULA;
