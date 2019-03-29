/* @flow
 * Created Date: Friday September 14th 2018
 * Author: Wahaj Shamim
 * Last Modified: Friday September 14th 2018 8:52:58 am
 * Modified By: Wahaj Shamim at <wahaj@Southbanksoftware.com>
 */
import React from 'react';
import { Link } from 'react-router-dom';
import EmailTickIcon from '../../style/icons/pages/login-signup-pages/email-tick-icon.svg';

const EmailConfirmed = () => (
  <div className="loginSignupRoot">
    <div className="pageCenter">
      <div className="pageIcon">
        <EmailTickIcon />
      </div>
      <div className="pageMessage">
        <span className="sectionTitle">Email Confirmed</span>
        <span className="sectionText">
          Thank you for verifying your email. You can now Log into ProvenDocs.
        </span>
      </div>
      <div className="footerLinks footerLinkSingleButton">
        <Link
          className="linkBtn primaryButton"
          to={{ pathname: '/login/email', search: '' }}
          style={{ textDecoration: 'none', width: '200px' }}
        >
          <div className="button-text">
            <span>Log In</span>
          </div>
        </Link>
      </div>
    </div>
  </div>
);

export default EmailConfirmed;
