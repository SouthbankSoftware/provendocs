// @Flow
import React from 'react';
import TopNavBar from '../../Navigation/TopNavBar';
import Footer from '../../Footer/Footer';
import { PAGES } from '../../../common/constants';
import './404.scss';

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
          <div className="mainPanel notFound">
            <div className="heroSection">
              <span className="heroText">This page is unproven (404)</span>
              <span className="heroSubtitle">
                For whatever reason we couldnt find this page for you, sorry!
              </span>
            </div>
            <Footer currentPage={PAGES.HOME} />
          </div>
        </div>
      </div>
    );
  }
}
