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
