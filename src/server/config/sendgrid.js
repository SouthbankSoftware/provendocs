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

import { DOMAINS } from '../common/constants';

// Change the url to the domain of your app
exports.url = `${DOMAINS.PROVENDOCS}`;

exports.senderEmail = 'admin@southbanksoftware.com';
exports.senderName = 'Provendb Admin';

// set 'exports.listId = null' to add contact to all contacts, but no specific list
// or a string with the listId to add to a specific list
exports.listId = '4583249';

// set 'exports.templateId = null' to opt out of using a template
// or a string with the templateId to use a template
exports.templateId = null;

// receive an email when a new signup is confirmed
exports.sendNotification = true;
exports.notificationEmail = 'developer@southbanksoftware.com';

// Template ID matching email template.
exports.templates = {
  WELCOME_TO_PROVENDOCS: 'd-a360a2c4f64d4cafb91b77f23d70f377',
  EMAIL_UPLOAD_SUCCEEDED: 'd-7959192d450443efaecc75e40c5428db',
  EMAIL_UPLOAD_FAILED: 'd-6d5441dd05524186b8f6155a45e700de',
  EMAIL_UPLOAD_NO_ACCOUNT_FOUND: 'd-dd48e1f24ff2401db255bb60b00b7285',
  SHARED_PROOF_TEMPLATE: 'd-11cc952fe04c44dab3d29a0c1c3824e3',
  SEND_PROOF_COPY: 'd-969a1753985a4fa488a3b6c0e0b375cf',
  VERIFY_EMAIL: 'd-62aff1f0c2d44485aad0e41808be687c',
  RESET_PASSWORD: 'd-a099bfadb8a540f281edc6608b50a8f8',
  CONFIRM_SUBSCRIPTION: 'd-d6b84b58d53f4927819f361139dd0c25',
  SUBSCRIPTION_THANKS: 'd-7ed5f4ed1ef14ba7b4036ca94944ae9d',
};
