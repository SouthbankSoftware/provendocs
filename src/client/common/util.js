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
