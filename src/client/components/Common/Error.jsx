/* @flow
 * @Author: Michael Harrison
 * @Date:   2018-12-12T12:01:01+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-01-04T11:04:42+11:00
 */
/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import CrossIcon from '../../style/icons/color/cross-icon.svg';
// $FlowFixMe
import './Error.scss';

type Props = {
  isFullScreen: boolean;
  message: string;
  title: string;
};

export default class Loading extends React.Component<Props> {
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
