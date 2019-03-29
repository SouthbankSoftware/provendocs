/*
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-21T09:28:25+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-14T10:45:55+11:00
 *
 *
 */
import React from 'react';
import { hot, setConfig } from 'react-hot-loader';
import { BrowserRouter } from 'react-router-dom';
import api from './common/api';
import Routes from './routes/routes';
import FailedRoutes from './routes/failedRoutes';

type Props = {};

type State = { status: boolean };

class App extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      status: false,
    };
  }

  componentWillMount() {
    api
      .checkStatus()
      .then(() => {
        this.setState({
          status: true,
        });
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
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      );
    }
    return (
      <BrowserRouter>
        <FailedRoutes />
      </BrowserRouter>
    );
  }
}

setConfig({ logLevel: 'debug' });

export default hot(module)(App);
