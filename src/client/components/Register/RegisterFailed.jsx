/*
 * @flow
 * Created Date: Monday August 13th 2018
 * Author: Michael Harrison
 * Last Modified: Friday August 31st 2018 3:24:14 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
import React from 'react';
import { Link } from 'react-router-dom';
import ErrorIcon from '../../style/icons/pages/login-signup-pages/error-icon.svg';

const RegisterFailed = () => (
  <div className="loginSignupRoot">
    <div className="pageCenter">
      <div className="pageIcon">
        <ErrorIcon />
      </div>
      <div className="pageMessage">
        <span className="sectionTitle">Error!</span>
        <span className="sectionText">Sorry, something went wrong. Please try again.</span>
      </div>
      <Link
        className="oAuthButton defaultButton"
        to={{ pathname: '/signup', search: '' }}
        style={{ textDecoration: 'none', width: '200px' }}
      >
        <div className="button-text">
          <span>Try Again</span>
        </div>
      </Link>
    </div>
  </div>
);

export default RegisterFailed;
