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
import ReactGA from 'react-ga';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Form, Input, Button } from 'antd';
import PenIcon from '../../style/icons/pages/login-signup-pages/pen-icon.svg';
import { DOMAINS } from '../../common/constants';
import { api, Log } from '../../common';

type Props = {
  form: any;
  history: any;
};

type State = {
  errForm: string;
};

class EmailSignup extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('EmailSignup');
    this.state = {
      errForm: '',
    };
  }

  componentDidMount() {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  compareToFirstPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue('password')) {
      callback('Your passwords do not match.');
    } else {
      callback();
    }
  };

  validateToNextPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && form.isFieldTouched('confirmPassword')) {
      form.validateFields(['confirmPassword'], { force: true });
    }
    callback();
  };

  handleSubmit = (e: any) => {
    e.preventDefault();
    this.setState({
      errForm: '',
    });
    const { form, history } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        let bActivated = false;
        if (process.env.SIGNUP_ENV === 'testing') {
          bActivated = true;
        }
        api
          .createUser(
            values.full_name ? values.full_name : '',
            values.email,
            values.password,
            bActivated,
          )
          .then((response) => {
            const { authToken, refreshToken, userID } = response.data;
            if (bActivated) {
              const url = `/api/signupSucceeded?authToken=${authToken}&refreshToken=${refreshToken}`;
              window.location.assign(url);
            } else {
              const b64userID = Buffer.from(userID).toString('base64');
              const verifyLink = `${DOMAINS.PROVENDOCS}/api/verifyUser?userID=${b64userID}`;
              api.sendVerificationEmail(values.email, verifyLink).then((resVerifyEmail) => {
                if (resVerifyEmail) {
                  history.push('/signup/emailSuccess');
                } else {
                  history.push('/signupFailed');
                }
              });
            }
          })
          .catch((errSignup) => {
            this.setState({
              errForm: errSignup.response.data.message,
            });
            Log.error(`Signup Error::${errSignup.response}`);
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
          <PenIcon />
        </div>
        <div className="pageMessage">
          <span className="sectionTitle">Sign Up</span>
          <span className="sectionText">Please fill in the fields below:</span>
        </div>

        <Form onSubmit={this.handleSubmit} className="antForm">
          {errForm !== '' && (
            <Form.Item>
              <span className="ant-form-explain">{errForm}</span>
            </Form.Item>
          )}
          <Form.Item>
            {getFieldDecorator('full_name')(<Input placeholder="Full Name" name="full_name" />)}
          </Form.Item>
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
                {
                  validator: this.validateToNextPassword,
                },
              ],
            })(<Input placeholder="Password" type="password" />)}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('confirmPassword', {
              rules: [
                {
                  required: true,
                  message: 'Confirm Password is required!',
                },
                {
                  validator: this.compareToFirstPassword,
                },
              ],
            })(<Input placeholder="Confirm Password" type="password" />)}
          </Form.Item>
          <Form.Item className="antFormItem">
            <Link className="linkBtn secondaryButton" to={{ pathname: '/signup', search: '' }}>
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
              Signup
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

const WrappedEmailSignup = Form.create()(EmailSignup);

export default withRouter(WrappedEmailSignup);
