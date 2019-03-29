/*
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-21T11:23:18+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-26T12:28:45+11:00
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
