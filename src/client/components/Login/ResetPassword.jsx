/*
 * @flow
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-21T14:26:20+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   wahaj
 * @Last modified time: 2019-04-10T14:29:40+10:00
 *
 */
import React from 'react';
import ReactGA from 'react-ga';
import { Link } from 'react-router-dom';
import { Form, Input, Button } from 'antd';
import { withRouter } from 'react-router';
import KeyIcon from '../../style/icons/pages/login-signup-pages/key-icon.svg';
import { api, Log } from '../../common';

type Props = {
  form: any;
  history: any;
};
type State = {
  errForm: string;
};

class ResetPassword extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('ResetPassword');
    this.state = {
      errForm: '',
    };
  }

  componentDidMount() {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  handleSubmit = (e: any) => {
    e.preventDefault();
    this.setState({
      errForm: '',
    });
    const { form, history } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        api
          .resetPassword(values.email)
          .then(() => {
            history.push('/login/resetSuccess');
          })
          .catch((errLogin) => {
            Log.error(`Login Error::${errLogin.response}`);
            if (errLogin.response && errLogin.response.data) {
              this.setState({
                errForm: errLogin.response.data,
              });
            }
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
          <KeyIcon />
        </div>
        <div className="pageMessage">
          <span className="sectionTitle">Reset Password</span>
          <span className="sectionText">
            Not to worry, we got you! Let’s get you a new password.
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
                  message: 'The input is not valid E-mail!',
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
              Reset
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

const WrappedResetPassword = Form.create()(ResetPassword);

export default withRouter(WrappedResetPassword);
