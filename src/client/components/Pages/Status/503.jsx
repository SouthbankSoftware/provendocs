// @Flow
import React from 'react';
import TopNavBar from '../../Navigation/TopNavBar';
import Footer from '../../Footer/Footer';
import { PAGES } from '../../../common/constants';
import './503.scss';

type Props = {};
type State = {};

export default class FailPage extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

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
