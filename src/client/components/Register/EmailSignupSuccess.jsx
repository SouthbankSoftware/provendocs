/*
 * Created Date: Friday September 14th 2018
 * Author: Wahaj Shamim
 * Last Modified: Friday September 14th 2018 8:52:58 am
 * Modified By: Wahaj Shamim at <wahaj@Southbanksoftware.com>
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
