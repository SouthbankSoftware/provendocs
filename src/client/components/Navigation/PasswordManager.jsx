/*
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2019-04-17T12:19:01+10:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   wahaj
 * @Last modified time: 2019-04-26T09:55:17+10:00
 *
 * Copyright (c) 2019 Southbank Software
 */

import React from 'react';
import {
  Input, Form, Button, notification, Modal,
} from 'antd';
import { api } from '../../common';

type Props = {
  user: any;
  form: any;
  showChangePassword: boolean;
  handleCancel: Function;
};
type State = {};
class PasswordManager extends React.Component<Props, State> {
  compareToFirstPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value !== form.getFieldValue('newPassword')) {
      callback('Two passwords that you enter is inconsistent!');
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

  HandleChangePassword = () => {
    const { form, user, handleCancel } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        api
          .updatePassword(user.email, values.currentPassword, values.newPassword)
          .then((response) => {
            console.log(response);
            notification.success({
              message: 'Password Changed successfully!',
              placement: 'bottomRight',
            });
            form.resetFields();
            handleCancel();
          })
          .catch((errChange) => {
            console.error(errChange);
            notification.error({
              message: 'Password Change failed!',
              placement: 'bottomRight',
            });
            form.resetFields();
          });
      }
      console.error(err);
    });
  };

  hasErrors = fieldsError => Object.keys(fieldsError).some(field => fieldsError[field]);

  render() {
    const { form, showChangePassword, handleCancel } = this.props;
    const { getFieldDecorator, getFieldsError } = form;

    return (
      <Modal
        className="changePasswordModal"
        visible={showChangePassword}
        title="Change Password"
        onOk={this.HandleChangePassword}
        onCancel={handleCancel}
        footer={[
          <Button
            type="secondary"
            className="antBtn secondaryButton"
            key="back"
            onClick={handleCancel}
          >
            Cancel
          </Button>,
          <Button
            type="primary"
            htmlType="submit"
            className="antBtn primaryButton"
            onClick={this.HandleChangePassword}
            disabled={this.hasErrors(getFieldsError())}
          >
            Change Password
          </Button>,
        ]}
      >
        <div className="passwordResetPanel fieldForm">
          <Form.Item label="Current Password">
            {getFieldDecorator('currentPassword', {
              rules: [
                {
                  required: true,
                  message: 'Password is required!',
                },
                {
                  validator: this.validateToNextPassword,
                },
              ],
            })(<Input className="fieldInput" type="password" />)}
          </Form.Item>
          <Form.Item label="New Password">
            {getFieldDecorator('newPassword', {
              rules: [
                {
                  required: true,
                  message: 'Password is required!',
                },
                {
                  validator: this.validateToNextPassword,
                },
              ],
            })(<Input className="fieldInput" type="password" />)}
          </Form.Item>
          <Form.Item label="Confirm Password">
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
            })(<Input className="fieldInput" type="password" />)}
          </Form.Item>
        </div>
      </Modal>
    );
  }
}

const WrappedPasswordManager = Form.create({ name: 'password_manager' })(PasswordManager);
export default WrappedPasswordManager;
