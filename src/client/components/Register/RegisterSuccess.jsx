/*
 * @flow
 * Created Date: Monday August 13th 2018
 * Author: Michael Harrison
 * Last Modified: Friday August 31st 2018 3:24:14 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
import React from 'react';
import LinkIcon from '../../style/icons/pages/login-signup-pages/link-icon.svg';

const RegisterSuccess = () => (
  <div className="loginSignupRoot">
    <div className="pageCenter">
      <div className="pageIcon">
        <LinkIcon />
      </div>
      <div className="pageMessage">
        <span className="sectionTitle">Account Linked</span>
        <span className="sectionText">
          Thank you for using ProvenDocs. You can now start proving.
        </span>
      </div>
      <a className="oAuthButton defaultButton" href="/dashboard">
        <div className="button-text">
          <span>Get Started</span>
        </div>
      </a>
    </div>
  </div>
);

export default RegisterSuccess;
