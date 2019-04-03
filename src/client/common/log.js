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
import debug from 'debug';

const BASE = 'provendb-ui';
const COLOURS = {
  trace: 'lightblue',
  info: 'blue',
  warn: 'pink',
  error: 'red',
}; // choose better colours :)

class Log {
  source: '';

  setSource(source) {
    this.source = source;
  }

  generateMessage(level, message) {
    // Set the prefix which will cause debug to enable the message
    const namespace = `${BASE}:${level}`;
    const createDebug = debug(namespace);

    // Set the colour of the message based on the level
    createDebug.color = COLOURS[level];

    if (this.source !== '') {
      createDebug(this.source, message);
    } else {
      createDebug(message);
    }
  }

  trace(message) {
    return this.generateMessage('trace', message);
  }

  info(message) {
    return this.generateMessage('info', message);
  }

  warn(message) {
    return this.generateMessage('warn', message);
  }

  error(message) {
    return this.generateMessage('error', message);
  }
}

export default new Log();
