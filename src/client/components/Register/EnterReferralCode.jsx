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
import {
  Button, Modal, Form, Input,
} from 'antd';
import TickIcon from '../../style/icons/pages/landing-page/tick-icon.svg';
import { api } from '../../common';
import ClockIcon from '../../style/icons/pages/login-signup-pages/clock-icon.svg';

type Props = {
  form: any,
};

type State = {
  dlgVisible: boolean,
  dlgSuccess: boolean,
};

class EnterRefferalCode extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      dlgVisible: false,
      dlgSuccess: false,
    };
  }

  componentDidMount() {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  showModal = () => {
    this.setState({
      dlgVisible: true,
    });
  };

  showSuccess = () => {
    this.setState({
      dlgSuccess: true,
    });
  };

  handleSubscribe = (e) => {
    const { form } = this.props;
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) {
        api.postEmailSubscribe(values).then(res => console.log(res));
        form.resetFields();
        this.setState({
          dlgVisible: false,
          dlgSuccess: true,
        });
      }
    });
  };

  handleCancel = () => {
    this.setState({
      dlgVisible: false,
      dlgSuccess: false,
    });
  };

  render() {
    const { dlgVisible, dlgSuccess } = this.state;
    const { form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <div className="pageCenter refer">
        <Modal
          className="subscribeModal"
          title="Subscribe to Waiting List"
          centered
          maskClosable={false}
          visible={dlgVisible}
          footer={null}
          onCancel={this.handleCancel}
          width={450}
        >
          <span className="dlgText">
            Subscribe to receive an invite to the next wave of ProvenDocs users.
          </span>
          <Form onSubmit={this.handleSubscribe}>
            <Form.Item>
              {getFieldDecorator('first_name')(
                <Input placeholder="First Name" name="first_name" />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('last_name')(<Input placeholder="Last Name" name="last_name" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('email', {
                rules: [
                  { required: true, message: 'Please input your Email!' },
                  {
                    type: 'email',
                    message: 'The input is not valid E-mail!',
                  },
                ],
              })(<Input placeholder="Email" name="email" />)}
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="primaryButton"
                onClick={this.handleSubscribe}
              >
                Subscribe
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          className="subscribeModal successModal"
          title="Thanks for subscribing!"
          centered
          visible={dlgSuccess}
          footer={null}
          onCancel={this.handleCancel}
          width={450}
        >
          <span className="dlgText">
            Please check your inbox for an email containing a link to verify your email address.
          </span>
          <div className="successIcon">
            <TickIcon />
          </div>
        </Modal>
        <div className="pageIcon">
          <ClockIcon />
        </div>
        <div className="pageMessage">
          <span className="sectionTitle">ProvenDocs is still in Early Access.</span>
          <span className="sectionText">
            During our early access period you must use a referral link sent to you to sign up. If
            you have one of these referral links please navigate there. Otherwise subscribe below
            and we will send you a link during the next wave of invites.
          </span>
          <Button
            type="primary"
            htmlType="submit"
            className="antBtn primaryButton"
            onClick={this.showModal}
          >
            Subscribe
          </Button>
        </div>
      </div>
    );
  }
}
const WrappedEnterRefferalCode = Form.create()(EnterRefferalCode);
export default withRouter(WrappedEnterRefferalCode);
