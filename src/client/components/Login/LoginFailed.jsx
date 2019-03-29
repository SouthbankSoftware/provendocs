/* @flow
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-26T12:16:19+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   wahaj
 * @Last modified time: 2019-03-06T14:12:24+11:00
 *
 */
/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { Link } from 'react-router-dom';
import { Form } from 'antd';
import CrossIcon from '../../style/icons/pages/login-signup-pages/error-icon.svg';

const FormItem = Form.Item;

type Props = {};

type State = {};
export default class LoginFailed extends React.Component<Props, State> {
  render() {
    return (
      <div className="loginSignupRoot">
        <div className="pageCenter">
          <div className="pageIcon">
            <CrossIcon />
          </div>
          <div className="pageMessage">
            <span className="sectionTitle">LOGIN FAILED!</span>
            <span className="sectionText">
              Could not log in with those credentials,
              {' '}
              <br />
              please try again or sign up.
            </span>
          </div>
          <Form className="antForm">
            <FormItem className="antFormItem">
              <Link
                className="linkBtn primaryButton"
                to={{ pathname: '/login', search: '' }}
                style={{ textDecoration: 'none' }}
              >
                <div className="button-text">
                  <span>Try Again</span>
                </div>
              </Link>
              <Link
                className="linkBtn secondaryButton"
                to={{ pathname: '/signup', search: '' }}
                style={{ textDecoration: 'none' }}
              >
                <div className="button-text">
                  <span>Sign Up</span>
                </div>
              </Link>
            </FormItem>
          </Form>
        </div>
      </div>
    );
  }
}
