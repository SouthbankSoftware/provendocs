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
