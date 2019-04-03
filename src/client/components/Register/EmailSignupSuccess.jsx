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
import { Form } from 'antd';
import WelcomeIcon from '../../style/icons/pages/login-signup-pages/welcome-icon.svg';

const FormItem = Form.Item;

const EmailSignupSuccess = () => (
  <div className="pageCenter">
    <div className="pageIcon">
      <WelcomeIcon />
    </div>
    <div className="pageMessage">
      <span className="sectionTitle">Welcome!</span>
      <span className="sectionText">
        Thanks for signing up! We just need you to verify your email
        <br />
        address to complete setting up your account.
      </span>
    </div>
    <Form className="antForm">
      <FormItem className="antFormItem">
        <Link
          className="linkBtn secondaryButton"
          to={{ pathname: '/signup/emailResend', search: '' }}
          style={{ textDecoration: 'none' }}
        >
          <div className="button-text">
            <span>Resend Email</span>
          </div>
        </Link>
        <Link
          className="linkBtn primaryButton"
          to={{ pathname: '/login', search: '' }}
          style={{ textDecoration: 'none' }}
        >
          <div className="button-text">
            <span>Login</span>
          </div>
        </Link>
      </FormItem>
    </Form>
  </div>
);

export default EmailSignupSuccess;
