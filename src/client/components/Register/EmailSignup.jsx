/*
 * @flow
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-21T14:26:20+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T16:00:55+11:00
 */
import React from 'react';
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
              const verifyLink = `http://${DOMAINS.PROVENDOCS}/api/verifyUser?userID=${b64userID}`;
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
