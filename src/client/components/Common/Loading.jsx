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

/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { Spin, Icon } from 'antd';
// $FlowFixMe
import './Loading.scss';

type Props = {
  isFullScreen: boolean,
  message?: string,
  color?: string,
};

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

export default class Loading extends React.Component<Props> {
  static defaultProps: Object;

  render() {
    const { isFullScreen, message, color } = this.props;
    let className = 'false';
    if (isFullScreen) {
      className = 'true';
    }
    const colorValue = color || '#FFF';
    return (
      <div className={`loadingWrapper isFullScreen_${className}`}>
        <Spin indicator={antIcon} />
        {message && (
          <span style={{ color: colorValue }} className="loadingMessage">
            {message}
          </span>
        )}
      </div>
    );
  }
}

Loading.defaultProps = {
  message: '',
  color: '#FFF',
};
