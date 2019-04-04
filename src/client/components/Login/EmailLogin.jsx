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
import { Form, Input, Button } from 'antd';
import { withRouter } from 'react-router';
import LockIcon from '../../style/icons/pages/login-signup-pages/lock-icon.svg';
import { api, Log } from '../../common';

type Props = {
  form: any,
};
type State = {
  errForm: string,
};

class EmailLogin extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('EmailLogin');
    this.state = {
      errForm: '',
    };
  }

  handleSubmit = (e: any) => {
    e.preventDefault();
    this.setState({
      errForm: '',
    });
    const { form } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        api
          .authUser(values.email, values.password)
          .then((response) => {
            const { authToken, refreshToken } = response.data;
            const url = `/api/loginSucceeded?authToken=${authToken}&refreshToken=${refreshToken}`;
            window.location.assign(url);
          })
          .catch((errLogin) => {
            this.setState({
              errForm: errLogin.response.data,
            });
            Log.error(`Login Error::${err}`);
          });
      }
    });
  };

  hasErrors = fieldsError => Object.keys(fieldsError).some(field => fieldsError[field]);

  render() {
    const { form } = this.props;
    const { getFieldsError, getFieldDecorator } = form;
    const { errForm } = this.state;
    return (
      <div className="pageCenter">
        <div className="pageIcon" style={{ height: '105px' }}>
          <LockIcon />
        </div>
        <div className="pageMessage">
          <span className="sectionTitle">Log In</span>
          <span className="sectionText">Please fill in the fields below:</span>
        </div>

        <Form onSubmit={this.handleSubmit} className="antForm">
          {errForm !== '' && (
            <Form.Item>
              <span className="ant-form-explain">Username / Password combination not found. </span>
            </Form.Item>
          )}
          <Form.Item>
            {getFieldDecorator('email', {
              rules: [
                { required: true, message: 'Email is required!' },
                {
                  type: 'email',
                  message: 'Please enter a valid E-Mail address.',
                },
              ],
            })(<Input placeholder="Email" name="email" />)}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('password', {
              rules: [
                {
                  required: true,
                  message: 'Password is required!',
                },
              ],
            })(<Input placeholder="Password" type="password" />)}
          </Form.Item>

          <Form.Item className="antFormItem">
            <Link className="linkBtn secondaryButton" to={{ pathname: '/login', search: '' }}>
              <div className="button-text">
                <span>Cancel</span>
              </div>
            </Link>
            <Button
              type="primary"
              htmlType="submit"
              className="antBtn primaryButton"
              disabled={this.hasErrors(getFieldsError())}
              onClick={this.handleSubmit}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        <div className="footerLinks">
          <span className="footerText">Forgot Password?</span>
          <div className="vr" />
          <Link to={{ pathname: '/login/forgot', search: '' }} style={{ textDecoration: 'none' }}>
            <span className="linkSpan">Reset</span>
          </Link>
        </div>
      </div>
    );
  }
}

const WrappedEmailLogin = Form.create()(EmailLogin);

export default withRouter(WrappedEmailLogin);
