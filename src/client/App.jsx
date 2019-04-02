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
import React, { Suspense } from 'react';
import { hot, setConfig } from 'react-hot-loader';
import { Spin, Icon } from 'antd';

import api from './common/api';

type Props = {};

type State = { status: boolean };

const antIcon = (
  <Icon
    type="loading"
    style={{
      fontSize: 100,
      fontWeight: '100',
      width: '100px',
      height: '100px',
      color: '#fff',
    }}
    spin
  />
);

const DefaultRoutes = React.lazy(() => import('./routes/routes'));
const FailedRoutes = React.lazy(() => import('./routes/failedRoutes'));

class App extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      status: true,
    };
  }

  componentWillMount() {
    api
      .checkStatus()
      .then(() => {
        const { status } = this.state;
        if (!status) {
          this.setState({
            status: true,
          });
        }
      })
      .catch(() => {
        this.setState({
          status: false,
        });
      });
  }

  render() {
    const { status } = this.state;
    if (status) {
      return (
        <Suspense
          fallback={(
            <div
              style={{
                backgroundColor: '#2f79a3',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spin indicator={antIcon} />
              <span
                style={{
                  color: '#fff',
                  opacity: 0.5,
                  marginTop: '20px',
                }}
              >
                Loading, Please Wait...
              </span>
            </div>
)}
        >
          <DefaultRoutes />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <FailedRoutes />
      </Suspense>
    );
  }
}

setConfig({ logLevel: 'debug' });

export default hot(module)(App);
