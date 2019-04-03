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
import CrossIcon from '../../style/icons/color/cross-icon.svg';
// $FlowFixMe
import './Error.scss';

type Props = {
  isFullScreen: boolean,
  message?: string,
  title?: string,
};

export default class Loading extends React.Component<Props> {
  static defaultProps: Object;

  render() {
    const { isFullScreen, message, title } = this.props;
    let className = 'false';
    if (isFullScreen) {
      className = 'true';
    }
    return (
      <div className={`errorWrapper isFullScreen_${className}`}>
        <CrossIcon className="crossIcon errorIcon" />
        {title && <h2>{title}</h2>}
        {message && <span>{message}</span>}
      </div>
    );
  }
}

Loading.defaultProps = {
  message: '',
  title: '',
};
