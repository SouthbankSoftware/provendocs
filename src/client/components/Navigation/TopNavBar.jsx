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
import HomeIcon from '../../style/icons/pages/top-nav-bar/home-icon.svg';
import { PAGES, OAUTH_PROVIDERS, DOMAINS } from '../../common/constants';
import { openNotificationWithIcon } from '../../common/util';
import { Log } from '../../common';
// $FlowFixMe
import './TopNavBar.scss';

type Props = {
  userDetailsCallback: any,
  currentPage: string,
  isAuthenticated: boolean,
  onEarlyAccess: Function | null,
};
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
    const { currentPage, userDetailsCallback } = this.props;
    if (currentPage === PAGES.DASHBOARD) {
      getUserDetails()
        .then((response) => {
          this.setState({ userDetails: response.data });
          userDetailsCallback(response.data);
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
              href="https://provendb.readme.io/docs/getting-started-with-provendocs"
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

  _renderSharedTopNav = () => {
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
        <Tooltip content="Dashboard" position={Position.BOTTOM}>
          <a className="leftButton" href="/dashboard" style={{ 'text-decoration': 'none' }}>
            <HomeIcon />
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
          <div className="homeLinks">
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <div className="vr" />
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a href="#howItWorks" className="link aboutLink" style={{ textDecoration: 'none' }}>
                <span className="aboutLabel">How It Works</span>
              </a>
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a href="#howToUseIt" className="link plansLink" style={{ textDecoration: 'none' }}>
                <span className="aboutLabel">How To Use It</span>
              </a>
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a
                href="#whatToUseItFor"
                className="link plansLink"
                style={{ textDecoration: 'none' }}
              >
                <span className="aboutLabel">What To Use It For</span>
              </a>
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a href="#theTeam" className="link plansLink" style={{ textDecoration: 'none' }}>
                <span className="aboutLabel">The Team</span>
              </a>
            )}
            {currentPage !== PAGES.HOME && currentPage !== PAGES.LANDING && <div className="vr" />}
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
          </div>
        </div>
        <div className="rightButtons">
          {currentPage === PAGES.HOME && this._renderHomeTopNav()}
          {currentPage === PAGES.LANDING && this._renderLandingTopNav()}
          {(currentPage === PAGES.LOGIN || currentPage === PAGES.REGISTER)
            && this._renderLoginTopNav()}
          {currentPage === PAGES.DASHBOARD && this._renderDashboardTopNav()}
          {currentPage === PAGES.SHARED && this._renderSharedTopNav()}
        </div>
      </div>
    );
  }
}
