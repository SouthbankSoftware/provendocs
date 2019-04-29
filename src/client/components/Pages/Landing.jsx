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
import Particles from 'react-particles-js';
import { withRouter } from 'react-router';
import {
  Steps, Button, Input, Form, Modal,
} from 'antd';
import MouseIcon from '../../style/icons/pages/landing-page/mouse-icon.svg';
import UserSignUpIcon from '../../style/icons/pages/landing-page/user-sign-up-icon.svg';
import UploadFilesIcon from '../../style/icons/pages/landing-page/upload-files-icon.svg';
import BlockchainIcon from '../../style/icons/pages/landing-page/blockchain-icon.svg';
import ViewShareDocumentsIcon from '../../style/icons/pages/landing-page/view-share-documents-icon.svg';
import WillIcon from '../../style/icons/pages/landing-page/will-icon.svg';
import StatDocumentIcon from '../../style/icons/pages/landing-page/clipboard-icon.svg';
import PropertyIcon from '../../style/icons/pages/landing-page/property-icon.svg';
import CalculatorIcon from '../../style/icons/pages/landing-page/calculator-icon.svg';
import IllustrationIcon from '../../style/icons/pages/landing-page/illustration-home.svg';
import TickIcon from '../../style/icons/pages/landing-page/tick-icon.svg';
import TopNavBar from '../Navigation/TopNavBar';
import Footer from '../Footer/Footer';
import { PAGES } from '../../common/constants';
import ParticleConfig from '../../common/particles';
import HOW_DOES_IT_WORK_STEPS from '../../common/landing_content';
import { checkAuthentication } from '../../common/authentication';
import api from '../../common/api';
// $FlowFixMe
import './Landing.scss';

const { Step } = Steps;

type Props = {
  location: any,
  match: any,
  history: any,
  form: any,
};
type State = {
  howDoesItWorkCurrentStep: number,
  sectionHeight: number,
  isAuthenticated: boolean,
  dlgVisible: boolean,
  dlgSuccess: boolean,
};
class LandingPage extends React.Component<Props, State> {
  constructor() {
    super();
    const sectionHeight = window.innerHeight - 76;
    this.state = {
      dlgVisible: false,
      dlgSuccess: false,
      howDoesItWorkCurrentStep: 0,
      sectionHeight,
      isAuthenticated: false,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    checkAuthentication().then((response: any) => {
      if (response.status === 200) {
        this.setState({ isAuthenticated: true });
      }
    });
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  componentWillReceiveProps() {}

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    const sectionHeight = window.innerHeight - 76;
    this.setState({ sectionHeight });
  };

  howDoesItWorkNextStep = () => {
    const { howDoesItWorkCurrentStep } = this.state;
    this.setState({ howDoesItWorkCurrentStep: howDoesItWorkCurrentStep + 1 });
  };

  howDoesItWorkPrevStep = () => {
    const { howDoesItWorkCurrentStep } = this.state;
    this.setState({ howDoesItWorkCurrentStep: howDoesItWorkCurrentStep - 1 });
  };

  showModal = () => {
    this.setState({
      dlgVisible: true,
    });
  };

  showSuccess = () => {
    this.setState({
      dlgSuccess: true,
    });
  };

  handleSubscribe = (e) => {
    const { form } = this.props;
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) {
        api.postEmailSubscribe(values).then(res => console.log(res));
        form.resetFields();
        this.setState({
          dlgVisible: false,
          dlgSuccess: true,
        });
      }
    });
  };

  handleCancel = () => {
    this.setState({
      dlgVisible: false,
      dlgSuccess: false,
    });
  };

  handleCancelThanks = () => {
    const { history } = this.props;
    history.push('/landing');
  };

  render() {
    const { dlgVisible, dlgSuccess } = this.state;
    const { form } = this.props;
    const { getFieldDecorator } = form;

    const {
      location: { pathname },
      match: { path },
    } = this.props;

    let page = 'default';
    const pagePath = pathname.replace(path, '').replace(/\//g, '');
    if (pagePath !== '') {
      page = pagePath;
    }

    const showThanksModal = page === 'thanks';

    const { sectionHeight } = this.state;

    const sectionStyle = { height: `${sectionHeight}px`, minHeight: `${sectionHeight}px` };

    const { howDoesItWorkCurrentStep, isAuthenticated } = this.state;
    return (
      <div className="App">
        <TopNavBar
          currentPage={PAGES.LANDING}
          isAuthenticated={isAuthenticated}
          onEarlyAccess={this.showModal}
        />
        <div className="AppBody">
          <div className="mainPanel landingPage">
            <div className="snap section heroSection" id="home" style={sectionStyle}>
              <Particles className="particles" params={ParticleConfig} style={sectionStyle} />
              <span className="heroText">Prove it forever with ProvenDocs.</span>
              <span className="heroSubtitle">
                The integrity, ownership and creation date of your documents are reliably stored on
                the Blockchain. The content of the documents can be private or shared.
              </span>
              <div className="heroButtons">
                <a
                  className="watchVideoButton dark button"
                  href="https://rebrand.ly/vw2nck"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="button-text">
                    <span>Watch Video</span>
                  </div>
                </a>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="antdButton"
                  onClick={this.showModal}
                >
                  Join Early Access
                </Button>
              </div>
              <div className="mouseIcon">
                <MouseIcon />
              </div>
            </div>
            <div className="snap section howDoesItWorkSection" style={sectionStyle}>
              <div className="sectionTitle" id="howItWorks">
                How does ProvenDocs work?
              </div>
              <div className="sectionBody">
                <div className="image">
                  <IllustrationIcon className="illustrationHome" width={350} height={480} />
                </div>
                <div className="imageBody">
                  <div className="top">
                    <Button
                      className="steps-button"
                      disabled={howDoesItWorkCurrentStep === 0}
                      type="primary"
                      onClick={() => this.howDoesItWorkPrevStep()}
                    >
                      {'<'}
                    </Button>
                    <div className="copy">
                      <Steps current={howDoesItWorkCurrentStep}>
                        {HOW_DOES_IT_WORK_STEPS.map(item => (
                          <Step key={item.title} />
                        ))}
                      </Steps>
                      <div className="steps-content">
                        {HOW_DOES_IT_WORK_STEPS[howDoesItWorkCurrentStep].content}
                      </div>
                    </div>
                    <Button
                      className="steps-button"
                      disabled={howDoesItWorkCurrentStep === HOW_DOES_IT_WORK_STEPS.length - 1}
                      type="primary"
                      onClick={() => this.howDoesItWorkNextStep()}
                    >
                      {'>'}
                    </Button>
                  </div>
                  <div className="bottom">
                    <div className="sectionButtons">
                      <a
                        className="watchVideo button"
                        href="https://rebrand.ly/vw2nck"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="button-text">
                          <span>Watch Video</span>
                        </div>
                      </a>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="antdButton dark"
                        onClick={this.showModal}
                      >
                        Join Early Access
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="snap section howSection" style={sectionStyle}>
              <div className="sectionTitle" id="howToUseIt">
                How do I use it?
              </div>
              <div className="sectionBody">
                <div className="sectionColumn 1">
                  <div className="columnIcon circleIcon">
                    <div className="iconWrapper">
                      <UserSignUpIcon />
                    </div>
                  </div>
                  <div className="columnTitle">
                    <b>Step 1: </b>
                    Sign Up
                  </div>
                  <div className="columnBody">
                    Sign up with a username/password or attach your account to your Google,
                    Facebook, Github or other identity.
                  </div>
                </div>
                <div className="sectionColumn 2">
                  <div className="columnIcon circleIcon">
                    <div className="iconWrapper">
                      <UploadFilesIcon />
                    </div>
                  </div>
                  <div className="columnTitle">
                    <b>Step 2:</b>
                    Upload Files
                  </div>
                  <div className="columnBody">
                    Directly upload files using a file browser or drag and drop.
                  </div>
                </div>
                <div className="sectionColumn 3">
                  <div className="columnIcon circleIcon">
                    <div className="iconWrapper">
                      <BlockchainIcon />
                    </div>
                  </div>
                  <div className="columnTitle">
                    <b>Step 3: </b>
                    {' '}
Prove files on the block chain
                  </div>
                  <div className="columnBody">
                    Track your uploads in real-time and receive a completed proof once your document
                    proof is securely proven on the blockchain.
                  </div>
                </div>
                <div className="sectionColumn 4">
                  <div className="columnIcon circleIcon">
                    <div className="iconWrapper">
                      <ViewShareDocumentsIcon />
                    </div>
                  </div>
                  <div className="columnTitle">
                    <b>Step 4:</b>
                    View and share files.
                  </div>
                  <div className="columnBody">
                    Store your proven documents in ProvenDocs or export the documents and proof to
                    your own storage. Preview, email or share a document securely at any time.
                  </div>
                </div>
              </div>
              <div className="sectionButtons">
                <a
                  className="watchVideo button"
                  href="https://rebrand.ly/vw2nck"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="button-text">
                    <span>Watch Video</span>
                  </div>
                </a>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="antdButton"
                  onClick={this.showModal}
                >
                  Join Early Access
                </Button>
              </div>
            </div>
            <div className="snap section whatSection" style={sectionStyle}>
              <div className="sectionTitle" id="whatToUseItFor">
                What can I use it for?
              </div>
              <div className="sectionBody">
                <div className="sectionColumn 1">
                  <div className="columnIcon">
                    <WillIcon className="will-icon" />
                  </div>
                  <div className="columnTitle">
                    <b>Wills and Legal Documents</b>
                  </div>
                  <div className="columnBody">
                    Need to maintain wills or other legal records? ProvenDocs can keep a record of
                    all the variations of your documents, proving each version on the blockchain.
                    Keep your legal records verifiable, confidential, and tamper-proof.
                  </div>
                </div>
                <div className="sectionColumn 2">
                  <div className="columnIcon">
                    <StatDocumentIcon className="clipboard-icon" />
                  </div>
                  <div className="columnTitle">
                    <b>Contracts and Commercial Documents</b>
                  </div>
                  <div className="columnBody">
                    The provenance and integrity of a contract or commercial document can be
                    established at any time. You can be sure that a document has not tampered,
                    post-dated or otherwise falsified.
                  </div>
                </div>
                <div className="sectionColumn 3">
                  <div className="columnIcon">
                    <PropertyIcon className="property-icon" />
                  </div>
                  <div className="columnTitle">
                    <b>Intellectual Property</b>
                  </div>
                  <div className="columnBody">
                    Prove ownership of any intellectual property securely, permanently and
                    incontrovertibly on the blockchain. The blockchain proof can be used to
                    establish your rights to art, patentable ideas, designs or any other
                    intellectual property.
                  </div>
                </div>
                <div className="sectionColumn 4">
                  <div className="columnIcon">
                    <CalculatorIcon className="calculator-icon" />
                  </div>
                  <div className="columnTitle">
                    <b>Accounting and Tax Records.</b>
                  </div>
                  <div className="columnBody">
                    You can prove the existence and timestamp of receipts, claims, accounting
                    records or any other time-sensitive information.
                  </div>
                </div>
              </div>
              <div className="sectionButtons">
                <a
                  className="watchVideo button"
                  href="https://rebrand.ly/vw2nck"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="button-text">
                    <span>Watch Video</span>
                  </div>
                </a>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="antdButton"
                  onClick={this.showModal}
                >
                  Join Early Access
                </Button>
              </div>
            </div>
            <div className="snap section aboutSection">
              <div className="aboutContent">
                <h1 className="aboutHeader" id="theTeam">
                  The Team
                </h1>

                <span className="bodyText">
                  ProvenDocs is powered by ProvenDB and designed by Southbank Software.
                  <br />
                  <br />
                  Southbank Software is a Melbourne based software development company that aims to
                  deliver useful, secure, and cost-effective solutions. Strangely enough, we work on
                  the north bank of Melbourne’s Yarra River.
                  <br />
                  <br />
                  Go figure.
                  <br />
                  <br />
                  Our team is united for their passion for JavaScript, Blockchain, Cloud, and
                  MongoDB. We love building ProvenDocs and hope you’ll enjoy using it.
                </span>
              </div>
              <div className="vr" />
              <div className="contactContent">
                <h3 className="contactHeading">Contact Us</h3>
                <span className="bodyText">
                  Level 3, 20 Queen St Melbourne, VIC 3000
                  <br />
                  support@provendb.com
                  <br />
                  <br />
                </span>
                <h3 className="subscribe"> Subscribe to our mailing list </h3>

                <Button
                  type="primary"
                  htmlType="submit"
                  className="antdButton"
                  onClick={this.showModal}
                >
                  Join Early Access
                </Button>
              </div>
            </div>

            <Footer currentPage={PAGES.LANDING} />
          </div>
        </div>
        <Modal
          className="subscribeModal"
          title="Subscribe to Proven Docs"
          centered
          maskClosable={false}
          visible={dlgVisible}
          footer={null}
          onCancel={this.handleCancel}
          width={450}
        >
          <span className="dlgText">Join our mailing list to get the latest announcements.</span>

          <Form onSubmit={this.handleSubscribe}>
            <Form.Item>
              {getFieldDecorator('first_name')(
                <Input placeholder="First Name" name="first_name" />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('last_name')(<Input placeholder="Last Name" name="last_name" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('email', {
                rules: [
                  { required: true, message: 'Please input your Email!' },
                  {
                    type: 'email',
                    message: 'The input is not valid E-mail!',
                  },
                ],
              })(<Input placeholder="Email" name="email" />)}
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="primaryButton"
                onClick={this.handleSubscribe}
              >
                Subscribe
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          className="subscribeModal successModal"
          title="Thanks for subscribing!"
          centered
          visible={dlgSuccess}
          footer={null}
          onCancel={this.handleCancel}
          width={450}
        >
          <span className="dlgText">
            Please check your inbox for an email containing a link to verify your email address.
          </span>
          <div className="successIcon">
            <TickIcon />
          </div>
        </Modal>
        <Modal
          className="subscribeModal successModal"
          title="Thanks for confirming your Email!"
          centered
          visible={showThanksModal}
          footer={null}
          onCancel={this.handleCancelThanks}
          width={450}
        >
          <div className="successIcon">
            <TickIcon />
          </div>
        </Modal>
      </div>
    );
  }
}

const WrappedLandingPage = Form.create()(LandingPage);

export default withRouter(WrappedLandingPage);
