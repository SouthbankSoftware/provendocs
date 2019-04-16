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
import { Button } from 'antd';
import { TopNavBar, Footer } from '..';
import { PAGES, DOWNLOAD_LINKS } from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
import './DownloadsPage.scss';

type Props = {};
type State = {
  isAuthenticated: boolean,
};

class Downloads extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      isAuthenticated: false,
    };
  }

  componentDidMount() {
    checkAuthentication().then((response: any) => {
      if (response.status === 200) {
        this.setState({ isAuthenticated: true });
      }
    });
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  render() {
    const { isAuthenticated } = this.state;
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
                function, allowing you to be sure your document is proven on the blockchain
              </span>
              <div className="downloadButtons">
                <Button href={} className="teal antbtn">Documentation</Button>
                <Button className="navy antbtn">Download</Button>
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
                <Button className="teal antbtn">Read</Button>
                <Button className="navy antbtn">Download</Button>
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
