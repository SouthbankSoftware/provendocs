/* @flow
 * @Author: Michael Harrison
 * @Date:   2019-02-26T09:19:43+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-13T13:42:48+11:00
 */
import React from 'react';
import { withRouter } from 'react-router';
import {
  Modal, Input, Form, Button, notification,
} from 'antd';
import { checkAuthentication } from '../../common/authentication';
import { api } from '../../common';
import Log from '../../common/log';
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
