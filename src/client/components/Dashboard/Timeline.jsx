/* @flow
 * @Author: Michael Harrison
 * @Date:   2018-09-18T09:18:55+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:55:37+11:00
 */

import React from 'react';

type State = {
  selectedVersion: number | null;
};

type Props = {};

export default class Timeline extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      selectedVersion: null,
    };
  }

  render() {
    const { selectedVersion } = this.state;
    return (
      <div className="timelineWrapper">
        <span className="selectedVersion">{selectedVersion}</span>
      </div>
    );
  }
}
