/* @flow
 * @Author: Michael Harrison
 * @Date:   2019-03-18T12:47:17+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:55:07+11:00
 */

/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { Spin, Icon } from 'antd';
// $FlowFixMe
import './Loading.scss';

type Props = {
  isFullScreen: boolean;
  message: string;
  color: string;
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
