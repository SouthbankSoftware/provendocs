/*
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
 * @Date:   2019-04-04T12:32:56+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-11T14:13:47+10:00
 */
import React from 'react';
import { Icon, Checkbox } from 'antd';
import Cookies from 'universal-cookie';
import ProofIcon from '../../style/icons/pages/dashboard/proof-progress-icon.svg';
import './ProofInProgress.scss';

const cookies = new Cookies();
type State = {
  remindMeChecked: boolean,
};

type Props = {};

export default class ProofInProgress extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      remindMeChecked: false,
    };
  }

  _onCheckRemindMe = (e: any) => {
    cookies.set('provendocs_upload_dont_remind_me', e.target.checked, { path: '/' });
    this.setState({ remindMeChecked: e.target.checked });
  };

  render() {
    const { remindMeChecked } = this.state;
    return (
      <div className="proofInProgressDialogueWrapper">
        <Icon className="heroIcon" type="reload" />
        <h2 className="title">Proof in Progress</h2>
        <span className="subtitle">
          Your proof is currently in progress. This may take up to two hours to complete.
        </span>
        <div className="hr" />
        <span className="reminder">Reminder:</span>
        <span className="message">
          Check your upload progress by clicking the
          {' '}
          <ProofIcon />
          {' '}
‘Proof Tab’ located in your right
          panel.
        </span>
        <div className="remindMeAgain">
          <Checkbox checked={remindMeChecked} onChange={this._onCheckRemindMe} />
          <span className="checkBoxLabel">Dont remind me again.</span>
        </div>
      </div>
    );
  }
}
