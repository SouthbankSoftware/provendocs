/*
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-26T15:37:42+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:57:10+11:00
 *
 */
import React from 'react';
import { Link } from 'react-router-dom';
import SuccessIcon from '../../style/icons/pages/login-signup-pages/tick-icon.svg';

const ResetPasswordSuccess = () => (
  <div className="pageCenter">
    <div className="pageIcon">
      <SuccessIcon />
    </div>
    <div className="pageMessage">
      <span className="sectionTitle">RESET PASSWORD</span>
      <span className="sectionText">Your password has been reset. Please check your email.</span>
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

export default ResetPasswordSuccess;
