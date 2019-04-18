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
import QueryString from 'query-string';
import { Form, Input, Button } from 'antd';
import { STATUS_CODES, DOMAINS } from '../../common/constants';
import { api } from '../../common';
import ErrorIcon from '../../style/icons/pages/login-signup-pages/error-icon.svg';

type Props = {
  form: any;
  history: any;
};
type State = {
  errForm: string;
  reason: string;
  userID: string;
};

class RegisterFailed extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      errForm: '',
      reason: STATUS_CODES.FAILED,
      userID: '',
    };
  }

  componentDidMount() {
    ReactGA.pageview(window.location.pathname + window.location.search);
    const query = QueryString.parse(window.location.search);
    if (query && query.reason) {
      this.setState({
        reason: query.reason,
      });
    }
    if (query && query.userID) {
      this.setState({
        userID: query.userID,
      });
    }
  }

  handleSubmit = (e: any) => {
    e.preventDefault();
    const { form, history } = this.props;
    const { userID } = this.state;
    form.validateFields((err, values) => {
      if (!err) {
        const verifyLink = `${DOMAINS.PROVENDOCS}/api/verifyUserEmail?userID=${userID}&email=${
          values.email
        }`;
        api.sendVerificationEmail(values.email, verifyLink).then((resVerifyEmail) => {
          if (resVerifyEmail) {
            history.push(`/signup/emailSuccess?userID=${userID}`);
          } else {
            history.push(`/signupFailed?reason=${STATUS_CODES.FAILED}`);
          }
        });
      }
    });
  };

  hasErrors = fieldsError => Object.keys(fieldsError).some(field => fieldsError[field]);

  renderGenericFailed = (msgFirstLine, msgSecondLine) => (
    <React.Fragment>
      <div className="pageIcon">
        <ErrorIcon />
      </div>
      <div className="pageMessage">
        <span className="sectionTitle">Error!</span>
        <span className="sectionText">
          {msgFirstLine}
          <br />
          {msgSecondLine}
        </span>
      </div>
      <Link
        className="oAuthButton defaultButton"
        to={{ pathname: '/signup', search: '' }}
        style={{ textDecoration: 'none', width: '200px' }}
      >
        <div className="button-text">
          <span>Try Again</span>
        </div>
      </Link>
    </React.Fragment>
  );

  renderNoEmail = () => {
    const { form } = this.props;
    const { getFieldsError, getFieldDecorator } = form;
    const { errForm } = this.state;
    return (
      <React.Fragment>
        {/* <div className="icon failedIcon">
        <CrossIcon />
      </div> */}
        <div className="pageMessage">
          <span className="sectionTitle">Almost there!</span>
          <span className="sectionText">
            The provider you selected does not expose an email address.
            {' '}
            <br />
            Please enter the email address to continue!
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
              Confirm
            </Button>
          </Form.Item>
        </Form>
      </React.Fragment>
    );
  };

  render() {
    const { reason } = this.state;
    return (
      <div className="loginSignupRoot">
        <div className="pageCenter">
          {reason === STATUS_CODES.NOEMAIL && this.renderNoEmail()}

          {reason === STATUS_CODES.FAILED
            && this.renderGenericFailed('Sorry, we were unable to register you.', 'Please try again.')}
          {reason === STATUS_CODES.NOTACTIVATED
            && this.renderGenericFailed(
              'Looks like your account is not activated',
              'please contact support.',
            )}
          {reason === STATUS_CODES.INVALIDPASSWORD
            && this.renderGenericFailed(
              'The password you entered is not corrent.',
              'please try again.',
            )}
          {reason === STATUS_CODES.USERNOTFOUND
            && this.renderGenericFailed('No user found with those credentials,', 'please try again.')}
          {reason === STATUS_CODES.SIGNUPFAILED
            && this.renderGenericFailed('Sorry, we were unable to register you.', 'please try again.')}
        </div>
      </div>
    );
  }
}

const WrappedRegisterFailed = Form.create()(RegisterFailed);
export default withRouter(WrappedRegisterFailed);
