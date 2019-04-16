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
 * @Date:   2019-04-16T12:45:33+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-16T12:47:41+10:00
 */
import React from 'react';
import ReactGA from 'react-ga';
import { withRouter } from 'react-router';
import { Button, Radio } from 'antd';
import { TopNavBar, Footer } from '..';
import {
  PAGES, DOWNLOAD_LINKS, ENVIRONMENT, OS,
} from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
import './DownloadsPage.scss';

type Props = {};
type State = {
  isAuthenticated: boolean,
  os: string,
  env: string,
};

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

class Downloads extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      isAuthenticated: false,
      os: OS.WINDOWS,
      env: ENVIRONMENT.PROD,
    };
  }

  componentDidMount() {
    console.log(process.env.PROVENDOCS_ENV);
    switch (process.env.PROVENDOCS_ENV) {
      case ENVIRONMENT.STAGING:
        this.setState({ env: ENVIRONMENT.STAGING });
        break;
      case ENVIRONMENT.DEV:
        this.setState({ env: ENVIRONMENT.DEV });
        break;
      case ENVIRONMENT.TEST:
        this.setState({ env: ENVIRONMENT.TEST });
        break;
      default:
        break;
    }

    checkAuthentication().then((response: any) => {
      if (response.status === 200) {
        this.setState({ isAuthenticated: true });
      }
    });
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  _changeOSRadio = (event: Object) => {
    console.log(event);
    this.setState({ os: event.target.value });
  };

  render() {
    const { isAuthenticated, env, os } = this.state;

    return (
      <div className="App download">
        <TopNavBar
          currentPage={PAGES.HOME}
          isAuthenticated={isAuthenticated}
          onEarlyAccess={null}
        />
        <div className="AppBody">
          <div className="mainPanel downloadsPage">
            <h1 className="downloadsHeader">ProvenDocs: Downloads</h1>
            <hr />
            <div className="downloadable">
              <h3 className="downloadsSubHeader">Verify Tool</h3>
              <span className="downloadDescription">
                The verify tool can be used to verify proof archives downloaded from ProvenDocs.
                This tool functions offline and does not depend on ProvenDocs or ProvenDB to
                function, allowing you to be sure your document is proven on the blockchain.
                <br />
                <br />
                Please make sure to download the tool for your desired operating system.
              </span>
              <div className="downloadOSRadio">
                <RadioGroup onChange={this._changeOSRadio} defaultValue={OS.WINDOWS} size="medium">
                  <RadioButton value={OS.WINDOWS}>Windows</RadioButton>
                  <RadioButton value={OS.MAC}>Mac OS</RadioButton>
                  <RadioButton value={OS.LINUX}>Linux</RadioButton>
                </RadioGroup>
              </div>
              <div className="downloadButtons">
                <Button
                  href={DOWNLOAD_LINKS.VERIFY_LATEST(env, os)}
                  target="__blank"
                  className="teal antbtn"
                >
                  Download
                </Button>
                <Button href={DOWNLOAD_LINKS.VERIFY_DOCS} target="__blank" className="navy antbtn">
                  Documentation
                </Button>
              </div>
            </div>
            <hr />
            <div className="downloadable">
              <h3 className="downloadsSubHeader">Litepaper</h3>
              <span className="downloadDescription">
                An introduction to the core ideas and principles relevant to ProvenDB, the
                blockchain enabled database that Provendocs is built on.
              </span>
              <div className="downloadButtons">
                <Button href={DOWNLOAD_LINKS.LITEPAPER} target="__blank" className="teal antbtn">
                  Download
                </Button>
                <Button
                  href={DOWNLOAD_LINKS.LITEPAPER_DOCS}
                  target="__blank"
                  className="navy antbtn"
                >
                  Read
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer currentPage={PAGES.LANDING} privacyOpen={false} onEarlyAccess={null} />
      </div>
    );
  }
}

export default withRouter(Downloads);
