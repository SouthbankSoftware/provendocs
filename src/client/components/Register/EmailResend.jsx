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
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Form, Input, Button } from 'antd';
import ClockIcon from '../../style/icons/pages/login-signup-pages/clock-icon.svg';
import { api } from '../../common';

type Props = {
  form: any;
  history: any;
};

type State = {
  errForm: string;
};

class EmailResend extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      errForm: '',
    };
  }

  handleSubmit = (e: any) => {
    e.preventDefault();
    const { form, history } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        api
          .resendVerificationEmail(values.email)
          .then((resVerifyEmail) => {
            if (resVerifyEmail) {
              history.push('/signup/emailResendSuccess');
            } else {
              history.push('/signupFailed');
            }
          })
          .catch((errSignup) => {
            this.setState({
              errForm: errSignup.response.data.message,
            });
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
        <div className="pageIcon">
          <ClockIcon />
        </div>
        <div className="pageMessage">
          <span className="sectionTitle">Haven’t received an email?</span>
          <span className="sectionText">
            Enter your email address below to receive a confirmation email.
          </span>
        </div>
        <Form onSubmit={this.handleSubmit} className="antForm">
          {errForm !== '' && (
            <Form.Item>
              <span className="ant-form-explain">{errForm}</span>
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
          <Form.Item className="antFormItem">
            <Link
              className="linkBtn secondaryButton"
              to={{ pathname: '/login', search: '' }}
              style={{ textDecoration: 'none' }}
            >
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
              Resend
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

const WrappedEmailResend = Form.create()(EmailResend);
export default withRouter(WrappedEmailResend);
