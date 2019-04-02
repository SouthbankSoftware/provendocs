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
