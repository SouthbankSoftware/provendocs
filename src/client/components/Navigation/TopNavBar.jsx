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
import ReactGA from 'react-ga';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import {
  Button, Dropdown, Icon, Menu, Modal,
} from 'antd';
import { withRouter } from 'react-router';
import { Tooltip, Position } from '@blueprintjs/core';
import { getUserDetails } from '../../common/authentication';
import InfoIcon from '../../style/icons/pages/dashboard/info-icon.svg'; // @TODO -> Used for getting started section.
import LogoutIcon from '../../style/icons/pages/top-nav-bar/log-out-icon.svg';
import LogoIcon from '../../style/icons/pages/top-nav-bar/proven-docs-logo.svg';
import ProvendbIcon from '../../style/icons/pages/top-nav-bar/powered-by-provendb.svg';
import HomeIcon from '../../style/icons/pages/top-nav-bar/home-icon.svg';
import {
  PAGES, OAUTH_PROVIDERS, DOMAINS, GA_CATEGORIES,
} from '../../common/constants';
import { openNotificationWithIcon } from '../../common/util';
import { Log, api } from '../../common';
// $FlowFixMe
import './TopNavBar.scss';

const { confirm } = Modal;

type Props = {
  userDetailsCallback: any,
  isAuthenticatedCallback: any,
  currentPage: string,
  isAuthenticated: boolean,
  onEarlyAccess: Function | null,
  history: any,
};
type State = { currentPage: string, userDetails: Object };
class TopNavBar extends React.Component<Props, State> {
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
    const { history, isAuthenticatedCallback } = this.props;
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
    const userMenu = (
      <Menu>
        <Menu.Item key="logout">
          <a href="/api/logout" style={{ textDecoration: 'none' }}>
            <Icon type="logout" style={{ marginRight: '8px' }} />
            Log Out
          </a>
        </Menu.Item>
        <Menu.Item key="logout">
          <a
            className="leftButton"
            href="https://provendb.readme.io/docs/getting-started-with-provendocs"
            target="__blank"
            style={{ 'text-decoration': 'none' }}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.TOPBAR,
                action: 'Click: #gettingStartedGuide',
                label: 'Button',
              });
            }}
          >
            <Icon type="info-circle" style={{ marginRight: '8px' }} />
            Getting Started
          </a>
        </Menu.Item>
        <Menu.Item key="logout">
          <span
            className="leftButton"
            style={{ 'text-decoration': 'none' }}
            key="deleteAccount"
            role="button"
            tabIndex={0}
            onClick={() => {
              ReactGA.event({
                category: GA_CATEGORIES.TOPBAR,
                action: 'Click: #deleteAccount',
                label: 'Button',
              });
              confirm({
                className: 'deleteAccountModal',
                title: 'Are you sure you want to wipe your account?',
                content: (
                  <span>
                    This action is
                    {' '}
                    <bold>permanent</bold>
                    , you will still be able to login after deleting your account but you will not be able to view your proofs or files.
                    <br />
                    {' '}
We suggest you download a proof archive for each of your files before
                    deleting your account.
                  </span>
                ),
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk() {
                  confirm({
                    className: 'deleteAccountModal',
                    title: 'Really delete account?',
                    content: (
                      <span>
                        Last chance to back out, are you really sure you want to delete all your files and proofs?
                      </span>
                    ),
                    okText: 'Delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk() {
                      isAuthenticatedCallback(false);
                      api
                        .deleteAccount()
                        .then((result) => {
                          Log.info(`Account deleted: ${result}`);
                          openNotificationWithIcon('success', 'Success', 'Account deleted.');
                          history.push('/');
                        })
                        .catch((error) => {
                          Log.error(`Error deleting account: ${error}`);
                          openNotificationWithIcon(
                            'warning',
                            'Error',
                            'Failed to delete account, please contact support.',
                          );
                          isAuthenticatedCallback(true);
                        });
                    },
                    onCancel() {},
                  });
                },
                onCancel() {},
              });
            }}
          >
            <Icon type="delete" twoToneColor="#cc4f46" style={{ marginRight: '8px' }} />
            Delete Account
          </span>
        </Menu.Item>
      </Menu>
    );

    return (
      <div className="homeButtons">
        <Dropdown
          className="userMenuBtn"
          overlay={userMenu}
          placement="bottomRight"
          overlayClassName="dropdownUser"
          // onClick={this.handleAvatarClick}
        >
          <Button style={{ marginLeft: 8 }}>
            {avatar}
            {userDetails && userDetails.email}
            <Icon type="down" />
          </Button>
        </Dropdown>
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
              onClick={() => {
                ReactGA.event({
                  category: GA_CATEGORIES.TOPBAR,
                  action: 'Click: #ProvenDocsLogo',
                  label: 'Button',
                });
              }}
            >
              <LogoIcon />
            </a>
            <a
              href={DOMAINS.PROVENDB}
              target="_blank"
              rel="noopener noreferrer"
              className="link homeLink provendbLogo"
              style={{ textDecoration: 'none' }}
              onClick={() => {
                ReactGA.event({
                  category: GA_CATEGORIES.TOPBAR,
                  action: 'Click: #poweredByProvenDB',
                  label: 'Button',
                });
              }}
            >
              <ProvendbIcon />
            </a>
          </div>
          <div className="homeLinks">
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <div className="vr" />
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a
                href="#howItWorks"
                className="link aboutLink"
                style={{ textDecoration: 'none' }}
                onClick={() => {
                  ReactGA.event({
                    category: GA_CATEGORIES.TOPBAR,
                    action: 'Click: #howItWorks',
                    label: 'Button',
                  });
                }}
              >
                <span className="aboutLabel">How It Works</span>
              </a>
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a
                href="#howToUseIt"
                className="link plansLink"
                style={{ textDecoration: 'none' }}
                onClick={() => {
                  ReactGA.event({
                    category: GA_CATEGORIES.TOPBAR,
                    action: 'Click: #howToUseIt',
                    label: 'Button',
                  });
                }}
              >
                <span className="aboutLabel">How To Use It</span>
              </a>
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a
                href="#whatToUseItFor"
                className="link plansLink"
                style={{ textDecoration: 'none' }}
                onClick={() => {
                  ReactGA.event({
                    category: GA_CATEGORIES.TOPBAR,
                    action: 'Click: #whatToUseItFor',
                    label: 'Button',
                  });
                }}
              >
                <span className="aboutLabel">What To Use It For</span>
              </a>
            )}
            {(currentPage === PAGES.HOME || currentPage === PAGES.LANDING) && (
              <a
                href="#theTeam"
                className="link plansLink"
                style={{ textDecoration: 'none' }}
                onClick={() => {
                  ReactGA.event({
                    category: GA_CATEGORIES.TOPBAR,
                    action: 'Click: #theTeam',
                    label: 'Button',
                  });
                }}
              >
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
              onClick={() => {
                ReactGA.event({
                  category: GA_CATEGORIES.TOPBAR,
                  action: 'Click: #Support',
                  label: 'Button',
                });
              }}
            >
              <span className="aboutLabel">Support</span>
            </a>
            <a
              href="https://provendb.readme.io/docs/features"
              className="link supportLink"
              style={{ textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ReactGA.event({
                  category: GA_CATEGORIES.TOPBAR,
                  action: 'Click: #Documentation',
                  label: 'Button',
                });
              }}
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

export default withRouter(TopNavBar);
