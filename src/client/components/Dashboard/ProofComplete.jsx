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
 * @Last modified time: 2019-04-04T15:18:13+11:00
 */
import React from 'react';
import { Icon, Checkbox } from 'antd';
import Cookies from 'universal-cookie';
import ProofIcon from '../../style/icons/pages/dashboard/view-proof-icon.svg';
import MerkleIcon from '../../style/icons/pages/dashboard/merkle-tree-icon.svg';
import TickIcon from '../../style/icons/pages/dashboard/tick-icon.svg';

import './ProofComplete.scss';

const cookies = new Cookies();
type State = {
  remindMeChecked: boolean,
};

type Props = {};

export default class ProofComplete extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      remindMeChecked: false,
    };
  }

  _onCheckRemindMe = (e: any) => {
    cookies.set('provendocs_proof_dont_remind_me', e.target.checked, { path: '/' });
    this.setState({ remindMeChecked: e.target.checked });
  };

  render() {
    const { remindMeChecked } = this.state;
    return (
      <div className="proofCompleteDialogueWrapper">
        <Icon className="heroIcon" type="smile" component={<TickIcon />} />
        <h2 className="title">Proof Complete</h2>
        <span className="subtitle">Your proof has been placed on the Blockchain</span>
        <div className="hr" />
        <span className="reminder">Reminder:</span>
        <span className="message">
          1. View your proof certificate by clicking the
          {' '}
          <ProofIcon />
          {' '}
‘Proof Tab’ located in your
          right panel.
          <br />
          2. To view a detailed view of your overall proof process, click the
          {' '}
          <MerkleIcon />
          {' '}
          ‘‘Merkle Tree’ button located above your right panel.
        </span>
        <div className="remindMeAgain">
          <Checkbox checked={remindMeChecked} onChange={this._onCheckRemindMe} />
          <span className="checkBoxLabel">Dont remind me again.</span>
        </div>
      </div>
    );
  }
}
