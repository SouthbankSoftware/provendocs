/*
 * @flow
 * Created Date: Tuesday July 31st 2018
 * Author: Michael Harrison
 * Last Modified: Friday August 31st 2018 3:24:14 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */

/* eslint class-methods-use-this: 1 */
import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import { Button } from 'antd';
import { Tooltip, Position } from '@blueprintjs/core';
import { getUserDetails } from '../../common/authentication';
import InfoIcon from '../../style/icons/pages/dashboard/info-icon.svg'; // @TODO -> Used for getting started section.
import LogoutIcon from '../../style/icons/pages/top-nav-bar/log-out-icon.svg';
import LogoIcon from '../../style/icons/pages/top-nav-bar/proven-docs-logo.svg';
import ProvendbIcon from '../../style/icons/pages/top-nav-bar/powered-by-provendb.svg';
import { PAGES, OAUTH_PROVIDERS, DOMAINS } from '../../common/constants';
import { openNotificationWithIcon } from '../../common/util';
import { Log } from '../../common';
// $FlowFixMe
import './TopNavBar.scss';

type Props = { currentPage: string, isAuthenticated: boolean, onEarlyAccess: Function | null };
type State = { currentPage: string, userDetails: Object };
export default class TopNavBar extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('TopNavBar');
    this.state = {
      currentPage: PAGES.DASHBOARD,
      userDetails: {},
    };
  }

  componentDidMount() {
    const { currentPage } = this.props;
    if (currentPage === PAGES.DASHBOARD) {
      getUserDetails()
        .then((response) => {
          this.setState({ userDetails: response.data });
        })
        .catch((err) => {
          Log.error(`Failed to fetch user details with err: ${err}`);
          openNotificationWithIcon('warning', 'Error', 'Failed to fetch user details.');
        });
    }
    this.setState({ currentPage: currentPage || '' });
  }

  _renderHomeTopNav = () => {
    const { isAuthenticated } = this.props;
    if (isAuthenticated) {
      return (
        <div className="homeButtons">
          <a
            className="button loginButton"
            href="/api/logout"
            style={{ 'text-decoration': 'none' }}
          >
            <span className="button-text">Log Out</span>
          </a>
          <Link
            className=" button signupButton"
            to={{ pathname: '/dashboard', search: '' }}
            style={{ textDecoration: 'none' }}
          >
            <span className=" button-text">Launch</span>
          </Link>
        </div>
      );
    }
    return (
      <div className="homeButtons">
        <Link
          className=" button loginButton"
          to={{ pathname: '/login', search: '' }}
          style={{ textDecoration: 'none' }}
        >
          <span className=" button-text">Log In</span>
        </Link>
        <Link
          className=" button signupButton"
          to={{ pathname: '/signup', search: '' }}
          style={{ textDecoration: 'none' }}
        >
          <span className=" button-text">Sign Up</span>
        </Link>
      </div>
    );
  };

  _renderLandingTopNav = () => {
    const { onEarlyAccess } = this.props;
    return (
      <div className="homeButtons">
        <span className="btnDescription">Join our early access program:</span>

        <Button type="primary" htmlType="submit" className="antdButton" onClick={onEarlyAccess}>
          Early Access
        </Button>
      </div>
    );
  };

  _renderLoginTopNav = () => (
    <Link
      className=" button homeButton"
      to={{ pathname: '/', search: '' }}
      style={{ textDecoration: 'none' }}
    >
      <span className=" button-text">Home</span>
    </Link>
  );

  _renderDashboardTopNav = () => {
    const { userDetails } = this.state;
    let avatar = <div />;
    switch (userDetails.provider) {
      case OAUTH_PROVIDERS.GOOGLE:
        avatar = <Avatar googleId={userDetails.googleID} size="25" round />;
        break;
      case OAUTH_PROVIDERS.GITHUB:
        avatar = <Avatar githubHandle={userDetails.githubID} size="25" round />;
        break;
      default:
        avatar = <Avatar name={userDetails.name} size="25" round />;
        break;
    }

    return (
      <div className="homeButtons">
        {
          <Tooltip content="Getting Started Guide" position={Position.BOTTOM}>
            <a
              className="leftButton"
              href="https://medium.com/provendb"
              target="__blank"
              style={{ 'text-decoration': 'none' }}
            >
              <InfoIcon className="leftButton" />
            </a>
          </Tooltip>
        }
        <Tooltip content="Logout" position={Position.BOTTOM}>
          <a className="leftButton" href="/api/logout" style={{ 'text-decoration': 'none' }}>
            <LogoutIcon />
          </a>
        </Tooltip>
        <div className="vr" />
        {avatar}
        <span className="emailAddress">{userDetails && userDetails.email}</span>
      </div>
    );
  };

  render() {
    const { currentPage } = this.state;
    return (
      <div className={`topNavigationRoot ${currentPage}`}>
        <div className="leftButtons">
          <div className="appLogo">
            <a
              href={DOMAINS.PROVENDOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="link homeLink docsLogo"
              style={{ textDecoration: 'none' }}
            >
              <LogoIcon />
            </a>
            <a
              href={DOMAINS.PROVENDB}
              target="_blank"
              rel="noopener noreferrer"
              className="link homeLink provendbLogo"
              style={{ textDecoration: 'none' }}
            >
              <ProvendbIcon />
            </a>
          </div>
          {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
            <div className="homeLinks">
              <div className="vr" />
              <a href="#howItWorks" className="link aboutLink" style={{ textDecoration: 'none' }}>
                <span className="aboutLabel">How It Works</span>
              </a>
              <a href="#howToUseIt" className="link plansLink" style={{ textDecoration: 'none' }}>
                <span className="aboutLabel">How To Use It</span>
              </a>
              <a
                href="#whatToUseItFor"
                className="link plansLink"
                style={{ textDecoration: 'none' }}
              >
                <span className="aboutLabel">What To Use It For</span>
              </a>
              <a href="#theTeam" className="link plansLink" style={{ textDecoration: 'none' }}>
                <span className="aboutLabel">The Team</span>
              </a>
              <a
                href="https://provendb.readme.io/v1.0/discuss"
                className="link supportLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="aboutLabel">Support</span>
              </a>
              <a
                href="https://provendb.readme.io/docs/features"
                className="link supportLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="aboutLabel">Documentation</span>
              </a>
              <a
                href="https://github.com/southbanksoftware.com/provendocs"
                className="link supportLink"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="aboutLabel">Github</span>
              </a>
            </div>
          )}
        </div>
        <div className="rightButtons">
          {currentPage === PAGES.HOME && this._renderHomeTopNav()}
          {currentPage === PAGES.LANDING && this._renderLandingTopNav()}
          {(currentPage === PAGES.LOGIN || currentPage === PAGES.REGISTER)
            && this._renderLoginTopNav()}
          {currentPage === PAGES.DASHBOARD && this._renderDashboardTopNav()}
        </div>
      </div>
    );
  }
}
