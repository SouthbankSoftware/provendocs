/*
 * @Author: Michael Harrison
 * @Date:   2019-03-18T12:47:17+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:53:56+11:00
 */

import _ from 'lodash';
import { notification } from 'antd';

export const convertBytes = (value: any, unit: string, length: number) => {
  const result = {
    value,
    unit,
  };
  if (String(Math.round(value)).length > length) {
    switch (unit) {
      case 'b':
        result.unit = 'kb';
        break;
      case 'kb':
        result.unit = 'mb';
        break;
      case 'mb':
        result.unit = 'gb';
        break;
      case 'gb':
        result.unit = 'tb';
        break;
      case 'tb':
        result.unit = 'pb';
        break;
      case 'pb':
        result.unit = 'eb';
        break;
      case 'b/s':
        result.unit = 'kb/s';
        break;
      case 'kb/s':
        result.unit = 'mb/s';
        break;
      case 'mb/s':
        result.unit = 'gb/s';
        break;
      case 'gb/s':
        result.unit = 'tb/s';
        break;
      default: {
        return result;
      }
    }

    result.value = parseFloat(value) / 1024;
    return convertBytes(result.value, result.unit, length);
  }
  result.value = _.round(parseFloat(value), 2);
  return result;
};

export const openNotificationWithIcon = (type: string, title: string, message: string) => {
  notification[type]({
    message: title,
    description: message,
  });
};
