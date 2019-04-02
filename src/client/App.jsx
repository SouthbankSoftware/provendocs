/*
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-21T09:28:25+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   wahaj
 * @Last modified time: 2019-04-03T09:02:01+11:00
 *
 *
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
