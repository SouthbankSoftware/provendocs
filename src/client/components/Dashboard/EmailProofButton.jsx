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
  Modal, Input, Form, Button, notification,
} from 'antd';
import { checkAuthentication } from '../../common/authentication';
import { api } from '../../common';
import Log from '../../common/log';
import { GA_CATEGORIES } from '../../common/constants';
import EmailIcon from '../../style/icons/pages/dashboard/share-icon.svg';

type Props = {
  fileName: string;
  fileVersion: number;
  form: any;
  history: any;
};
type State = {
  showModal: boolean;
  sending: boolean;
};

const openNotificationWithIcon = (type: string, title: string, message: string) => {
  notification[type]({
    message: title,
    description: message,
  });
};

class EmailProofButton extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('EmailProofButton');
    this.state = {
      showModal: false,
      sending: false,
    };
  }

  componentDidMount() {}

  handleSubmit = (e) => {
    const {
      form, fileName, fileVersion, history,
    } = this.props;
    e.preventDefault();

    checkAuthentication()
      .then((response: any) => {
        if (response.status === 200) {
          this.setState({ sending: true });
          form.validateFields((err, values) => {
            if (!err) {
              const { email } = values;
              api
                .sendEmailProof(fileName, fileVersion, email)
                .then(() => {
                  openNotificationWithIcon(
                    'success',
                    'Email Proof Sent',
                    'Your Proof Archive has been successfully sent via email.',
                  );
                  this.setState({ sending: false });
                })
                .catch((sendErr) => {
                  Log.error(`Error emailing your proof: ${sendErr}`);
                  openNotificationWithIcon(
                    'error',
                    'Email Proof Failed',
                    'Sorry, we failed to send your proof via email for an unknown reason, please contact support.',
                  );
                  this.setState({ sending: false });
                });
            } else {
              Log.error(`Validation Err: ${err}`);
              this.setState({ sending: false });
            }
          });
        } else if (response.response.status === 400) {
          history.push('/login/expired');
        }
      })
      .catch(() => {
        history.push('/login/expired');
      });
  };

  hasErrors = fieldsError => Object.keys(fieldsError).some(field => fieldsError[field]);

  render() {
    const { form } = this.props;
    const { getFieldDecorator, getFieldsError } = form;
    const { showModal, sending } = this.state;

    return (
      <div className="emailProofButtonWrapper">
        <EmailIcon
          className=" emailIcon"
          onClick={() => {
            ReactGA.event({
              category: GA_CATEGORIES.DASHBOARD,
              action: 'Receive this proof via email.',
              label: 'Button',
            });
            this.setState({ showModal: true });
          }}
        />
        <Modal
          className="emailProofModal confirmModal successModal"
          title={(
            <div className="titleWrapper">
              <EmailIcon className="emailIcon large blue" />
              <span>Email Proof</span>
            </div>
)}
          centered
          onCancel={() => {
            this.setState({ showModal: false });
          }}
          visible={showModal}
          footer={null}
          width={320}
        >
          <div className="bodyWrapper">
            <span className="message">
              Please enter an email address you would like to send your email to below.
            </span>
            <Form onSubmit={this.handleSubmit}>
              <Form.Item>
                {getFieldDecorator('email', {
                  rules: [
                    { required: true, message: 'Please input your Email!' },
                    {
                      type: 'email',
                      message: 'Please enter a valid E-Mail address.',
                    },
                  ],
                })(<Input placeholder="Email" name="email" />)}
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="primaryButton"
                  onClick={this.handleSubmit}
                  disabled={this.hasErrors(getFieldsError())}
                  loading={sending}
                >
                  Send
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}

const WrappedEmailProofButton = Form.create({ name: 'email_proof_button' })(EmailProofButton);
export default withRouter(WrappedEmailProofButton);
