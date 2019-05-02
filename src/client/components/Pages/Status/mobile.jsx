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
  Button, Input, Form, Modal,
} from 'antd';
import TopNavBar from '../../Navigation/TopNavBar';
import Footer from '../../Footer/Footer';

import { PAGES, GA_CATEGORIES } from '../../../common/constants';
import api from '../../../common/api';

import TickIcon from '../../../style/icons/pages/landing-page/tick-icon.svg';
import './mobile.scss';

type Props = {
  location: any;
  match: any;
  history: any;
  form: any;
};
type State = {
  dlgVisible: boolean;
  dlgSuccess: boolean;
};

class MobilePage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      dlgVisible: false,
      dlgSuccess: false,
    };
  }

  componentDidMount() {
    const pagePath = window.location.pathname + window.location.search;
    ReactGA.event({
      category: GA_CATEGORIES.PAGE_404,
      action: `visit page:${pagePath}`,
      label: 'Button',
    });
    ReactGA.pageview(pagePath);
  }

  componentWillReceiveProps() {}

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

  handleCancelThanks = () => {
    const { history } = this.props;
    history.push('/landing');
  };

  render() {
    const { dlgVisible, dlgSuccess } = this.state;
    const { form } = this.props;
    const { getFieldDecorator } = form;

    const {
      location: { pathname },
      match: { path },
    } = this.props;

    let page = 'default';
    const pagePath = pathname.replace(path, '').replace(/\//g, '');
    if (pagePath !== '') {
      page = pagePath;
    }

    const showThanksModal = page === 'thanks';

    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.SUPPORT} />
        <div className="AppBody">
          <div className="mainPanel mobile">
            <div className="heroSection">
              <span className="heroText">
                Mobile Support
                <br />
                {' '}
coming soon!
                <br />
              </span>
              <span className="heroSubtitle">
                Sorry, currently we only support desktop browsers. Mobile browsers support is in the
                works and will be there soon.
                <br />
                <br />
                {' '}
Subscribe to our mailing list to keep getting the latest updates.
                <br />
                <br />
                <Button
                  type="primary"
                  htmlType="submit"
                  className="antdButton"
                  onClick={this.showModal}
                >
                  Subscribe
                </Button>
              </span>
            </div>
            <Footer currentPage={PAGES.HOME} />
          </div>
        </div>
        <Modal
          className="subscribeModal"
          title="Subscribe to Proven Docs"
          centered
          maskClosable={false}
          visible={dlgVisible}
          footer={null}
          onCancel={this.handleCancel}
          width={450}
        >
          <span className="dlgText">Join our mailing list to get the latest announcements.</span>

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
        <Modal
          className="subscribeModal successModal"
          title="Thanks for confirming your Email!"
          centered
          visible={showThanksModal}
          footer={null}
          onCancel={this.handleCancelThanks}
          width={450}
        >
          <div className="successIcon">
            <TickIcon />
          </div>
        </Modal>
      </div>
    );
  }
}
const WrappedMobilePage = Form.create()(MobilePage);

export default withRouter(WrappedMobilePage);
