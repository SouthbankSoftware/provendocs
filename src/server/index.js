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
/* eslint-disable no-console */
const app = require('./server');

const port = process.env.PROVENDOCS_PORT || 8888;
app.listen(port, () => {
  console.log('__________________________________________________');
  console.log('\n\n ___                        ___');
  console.log('| _ \\_ _ _____ _____ _ _   |   \\ ___  __ ___   ');
  console.log("|  _/ '_/ _ \\ V / -_) ' \\  | |) / _ \\/ _(_-<   ");
  console.log('|_| |_| \\___/\\_/\\___|_||_| |___/\\___/\\__/__/__ ');
  console.log('| |__ _  _  | _ \\_ _ _____ _____ _ _ |   \\| _ )');
  console.log("| '_ \\ || | |  _/ '_/ _ \\ V / -_) ' \\| |) | _ \\");
  console.log('|_.__/\\_, | |_| |_| \\___/\\_/\\___|_||_|___/|___/');
  console.log('      |__/                                     \n\n');
  console.log('__________________________________________________');
});
