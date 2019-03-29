/*
 * @Author: Michael Harrison
 * @Date:   2018-12-14T08:25:07+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:55:33+11:00
 */

import React from 'react';
import { Tab, Tabs } from '@blueprintjs/core';
// $FlowFixMe
import './TabbedPanel.scss';
import autobind from 'autobind-decorator';

type Props = {
  setTabCallback: any;
  tabs: any;
  className: string;
  tabSelected: string;
  extraComponents: any;
};
type State = {};
export default class TabbedPanel extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

  componentWillReceiveProps() {}

  @autobind
  _onChange(newTabId: string) {
    const { setTabCallback } = this.props;
    setTabCallback(newTabId);
  }

  @autobind
  renderTabs() {
    const { tabs } = this.props;
    const newTabs = [];
    tabs.forEach((tab) => {
      newTabs.push(
        <Tab id={tab.id} className={tab.title} title={tab.title || tab.icon} panel={tab.panel} />,
      );
    });
    return newTabs;
  }

  render() {
    const {
      className, tabSelected, tabs, extraComponents,
    } = this.props;
    const newClassName = className || 'tabs';
    return (
      <div className="tabbedPanelWrapper">
        <Tabs
          className={`${newClassName} tabbedPanel`}
          onChange={this._onChange}
          selectedTabId={tabSelected}
          defaultSelectedTabId={tabs[0].id}
        >
          {this.renderTabs()}
          <Tabs.Expander />
          <div className="extraTabContent">{extraComponents}</div>
        </Tabs>
      </div>
    );
  }
}
