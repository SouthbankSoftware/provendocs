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
import TopNavBar from '../../Navigation/TopNavBar';
import Footer from '../../Footer/Footer';
import { PAGES, GA_CATEGORIES } from '../../../common/constants';
import './503.scss';

type Props = {};
type State = {};

export default class FailPage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    const pagePath = window.location.pathname + window.location.search;
    ReactGA.event({
      category: GA_CATEGORIES.PAGE_503,
      action: `visit page:${pagePath}`,
      label: 'Button',
    });
    ReactGA.pageview(pagePath);
  }

  componentWillReceiveProps() {}

  render() {
    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.SUPPORT} />
        <div className="AppBody">
          <div className="mainPanel serverDown">
            <div className="heroSection">
              <span className="heroText">Sorry, ProvenDocs is down (503)</span>
              <span className="heroSubtitle">
                ProvenDocs is currently down, maybe for maintenence but probably gremlins got into
                the engine. Please try again later.
              </span>
            </div>
            <Footer currentPage={PAGES.HOME} />
          </div>
        </div>
      </div>
    );
  }
}
