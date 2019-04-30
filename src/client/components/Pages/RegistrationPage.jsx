/* eslint-disable react/no-unused-prop-types */
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
import { withRouter, Redirect } from 'react-router';
import {
  Register,
  RegisterSuccess,
  RegisterFailed,
  EmailSignup,
  EmailSignupSuccess,
  EmailConfirmed,
  EmailResend,
  EmailResendSuccess,
  EnterRefferalCode,
} from '../Register';
import { TopNavBar, Footer } from '../index';
import { PAGES } from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
import { api, Log } from '../../common';
// $FlowFixMe
import './LoginSignup.scss';
import { Loading } from '../Common';
import { openNotificationWithIcon } from '../../common/util';

type State = {
  loggedIn: boolean,
  hasReferralToken: boolean,
  isReferralRequired: boolean,
  loading: boolean,
};
type Props = {
  signedUp: boolean,
  eulaIsOpen: boolean,
  securityIsOpen: boolean,
  signUpFailed: boolean,
  history: any,
  location: any,
  match: any,
};
class RegisterationPage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      loggedIn: false,
      hasReferralToken: false,
      isReferralRequired: true,
      loading: true,
    };
  }

  componentWillMount() {
    Log.setSource('RegistrationPage');
    const { loggedIn } = this.state;
    checkAuthentication()
      .then((response: Object) => {
        if (response.status === 200 && loggedIn !== true) {
          this.setState({ loggedIn: true });
        } else if (response.response.status === 400 && loggedIn !== false) {
          this.setState({ loggedIn: false });
        }
      })
      .catch((err) => {
        if (err.response.status === 400 && loggedIn !== false) {
          // Invalid Token, log in again.
          this.setState({ loggedIn: false });
        }
      });

    // Check if referral code is needed:
    console.log('Checking if Referrel code is required...');
    api
      .isReferralRequired()
      .then((result) => {
        console.log('Is Refferel code required: ', result);
        if (result.data.referralRequired) {
          this.setState({ isReferralRequired: true });
          // Check if they have a refferal token.
          const token = localStorage.getItem('provendocs_referral_code');
          if (token) {
            let count = 0;
            const checkGrowsurfInterval = setInterval(() => {
              console.log('Checking Growsurf is initialized: ', count, ' / 20');
              if (window && window.growsurf && window.growsurf.getParticipantById) {
                console.log('Growsurf avaliable');
                window.growsurf
                  .getParticipantById(token)
                  .then((res) => {
                    console.log('Got Growsurf Participant.');
                    if (!res) {
                      this.setState({ hasReferralToken: false });
                      this.setState({ loading: false });
                    } else {
                      this.setState({ hasReferralToken: true });
                      this.setState({ loading: false });
                    }
                  })
                  .catch((getParticipantErr) => {
                    Log.error(getParticipantErr);
                    this.setState({ hasReferralToken: false });
                    this.setState({ loading: false });
                  });
                clearInterval(checkGrowsurfInterval);
              } else {
                if (count === 5) {
                  console.error(
                    'Failed to validate referrel participant in 5000ms, triggering load window event....',
                  );
                  const evt = document.createEvent('Event');
                  evt.initEvent('load', false, false);
                  window.dispatchEvent(evt);
                } else if (count === 10) {
                  console.error(
                    'Failed to validate referrel participant in 10000ms, triggering load window event....',
                  );
                  const evt = document.createEvent('Event');
                  evt.initEvent('load', false, false);
                  window.dispatchEvent(evt);
                } else if (count === 15) {
                  console.error(
                    'Failed to validate referrel participant in 15000ms, triggering load window event....',
                  );
                  const evt = document.createEvent('Event');
                  evt.initEvent('load', false, false);
                  window.dispatchEvent(evt);
                } else if (count > 20) {
                  console.error('Failed to validate referrel participant in 20000ms, Giving up :(');
                  clearInterval(checkGrowsurfInterval);
                }
                count += 1;
              }
            }, 1000);
          } else {
            this.setState({ hasReferralToken: true });
            this.setState({ loading: false });
          }
        } else {
          this.setState({ isReferralRequired: false });
          this.setState({ loading: false });
        }
      })
      .catch((isRefRequiredErr) => {
        console.error('IsRefRequired Err: ', isRefRequiredErr);
        this.setState({ isReferralRequired: true });
        // Check if they have a refferal token.
        const token = localStorage.getItem('provendocs_referral_code');
        if (token) {
          let count = 0;
          const checkGrowsurfInterval = setInterval(() => {
            count += 1;
            if (count > 20) {
              console.error(
                'Failed to validate referrel participant in 20000ms, please contact support.',
              );
              openNotificationWithIcon(
                'error',
                'Failed to check refferal.',
                'Sorry, we were unable to validate your referral link in a timely manor, please make sure you have navigated here via a referral link or contact support.',
              );
              clearInterval(checkGrowsurfInterval);
              this.setState({ loading: false });
              this.setState({ hasReferralToken: false });
            }
            if (window && window.growsurf && window.growsurf.getParticipantById) {
              console.log('Growsurf initialized, checking participant ID.');
              window.growsurf
                .getParticipantById(token)
                .then((res) => {
                  console.log('Got Growsurf Participant.');
                  if (!res) {
                    this.setState({ hasReferralToken: false });
                    this.setState({ loading: false });
                  } else {
                    this.setState({ hasReferralToken: true });
                    this.setState({ loading: false });
                  }
                })
                .catch((getParticipantErr) => {
                  Log.error(getParticipantErr);
                  this.setState({ hasReferralToken: false });
                  this.setState({ loading: false });
                });
              clearInterval(checkGrowsurfInterval);
            } else {
              console.log('Waiting for GrowSurf, wait counter: ', count, ' / 20');
            }
          }, 1000);
        } else {
          this.setState({ hasReferralToken: false });
          this.setState({ loading: false });
        }
      });
  }

  componentDidMount() {}

  componentWillReceiveProps() {}

  handleLogoClick = () => {
    const { history } = this.props;
    history.push('/');
  };

  render() {
    const {
      location: { pathname },
      match: { path },
      signedUp,
      signUpFailed,
    } = this.props;
    const {
      loggedIn, hasReferralToken, isReferralRequired, loading,
    } = this.state;
    let page = 'default';
    const pagePath = pathname.replace(path, '').replace(/\//g, '');
    if (pagePath !== '') {
      page = pagePath;
    }
    if (signedUp || signUpFailed) {
      page = 'none';
    }
    if (!hasReferralToken && isReferralRequired) {
      page = 'noReferralToken';
    }
    if (loggedIn) {
      return <Redirect to="/dashboard" />;
    }

    if (loading) {
      return (
        <div className="App">
          <TopNavBar currentPage={PAGES.REGISTER} isAuthenticated={loggedIn} />
          <div className="AppBody">
            <div className="mainPanel">
              <div className="loginSignupRoot">
                <Loading isFullScreen={false} />
              </div>
            </div>
          </div>
          <Footer currentPage={PAGES.HOME} privacyOpen={false} />
        </div>
      );
    }

    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.REGISTER} isAuthenticated={loggedIn} />
        <div className="AppBody">
          <div className="mainPanel">
            <div className="loginSignupRoot">
              {signedUp && <RegisterSuccess />}
              {signUpFailed && <RegisterFailed />}
              {page === 'default' && <Register pageProps={this.props} />}
              {page === 'email' && <EmailSignup />}
              {page === 'emailSuccess' && <EmailSignupSuccess />}
              {page === 'emailConfirm' && <EmailConfirmed />}
              {page === 'emailResend' && <EmailResend />}
              {page === 'emailResendSuccess' && <EmailResendSuccess />}
              {page === 'noReferralToken' && <EnterRefferalCode />}
            </div>
          </div>
        </div>
        <Footer currentPage={PAGES.HOME} privacyOpen={false} />
      </div>
    );
  }
}

export default withRouter(RegisterationPage);
