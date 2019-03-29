/*
 * Created Date: Friday September 14th 2018
 * Author: Wahaj Shamim
 * Last Modified: Friday September 14th 2018 8:52:58 am
 * Modified By: Wahaj Shamim at <wahaj@Southbanksoftware.com>
 */
import React from 'react';
import { Link } from 'react-router-dom';

import PaperPlaneIcon from '../../style/icons/pages/login-signup-pages/paper-plane-icon.svg';

const EmailResendSuccess = () => (
  <div className="pageCenter">
    <div className="pageIcon">
      <PaperPlaneIcon />
    </div>
    <div className="pageMessage">
      <span className="sectionTitle">RESENT</span>
      <span className="sectionText">
        To verify your identity we’ve sent a confirmation email to confirm
        <br />
        your email address and activate your account.
      </span>
    </div>
    <div className="footerLinks footerLinkSingleButton">
      <Link
        className="linkBtn primaryButton"
        to={{ pathname: '/login', search: '' }}
        style={{ textDecoration: 'none' }}
      >
        <div className="button-text">
          <span>Login</span>
        </div>
      </Link>
    </div>
  </div>
);

export default EmailResendSuccess;
