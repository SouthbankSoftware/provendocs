/*
 * @flow
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-21T14:26:20+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T16:00:43+11:00
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
