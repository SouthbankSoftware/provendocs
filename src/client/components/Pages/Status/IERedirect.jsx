/*
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
 * @Date:   2019-05-01T14:06:40+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-05-01T14:10:05+10:00
 */

import React from 'react';
import ReactGA from 'react-ga';
import { GA_CATEGORIES } from '../../../common/constants';
import './IERedirect.scss';

type Props = {};
type State = {};

export default class IERedirect extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {};
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

  render() {
    return (
      <div className="App">
        <div className="AppBody">
          <div className="mainPanel notFound">
            <div className="heroSection">
              <span className="heroText">Sorry! We dont current support your browser.</span>
              <span className="heroSubtitle">
                Your browser is not currently supported by ProvenDocs, please contact support at
                {' '}
                <a href="https://provendb.readme.io/discuss">our support channel</a>
                {' '}
or email us at
                {' '}
                <a href="mainto:support@provendb.com">support@provendb.com</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
