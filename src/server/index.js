/*
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2018-11-20T16:34:37+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-13T14:32:51+11:00
 *
 *
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
