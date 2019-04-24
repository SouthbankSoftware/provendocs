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
import React from 'react';
import { withRouter } from 'react-router';
import Cryptr from 'cryptr';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Icon, Button } from 'antd';
import Log from '../../common/log';
// $FlowFixMe
import './ShareDialog.scss';
import { openNotificationWithIcon } from '../../common/util';
import { ENVIRONMENT, DOMAINS } from '../../common/constants';

const urlEncryptionKey = process.env.PROVENDOCS_SECRET || 'mySecretHere';
const cryptr = new Cryptr(urlEncryptionKey);

type Props = {
  file: Object,
  userDetails: Object,
};

type State = {
  file: Object,
  userInformation: Object,
};

Log.setSource('ShareDialog');

class ShareDialog extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      file: {},
      userInformation: {},
    };
  }

  componentDidMount() {
    this.setState({ file: this.props.file });
    this.setState({ userInformation: this.props.userDetails });
  }

  componentWillReceiveProps(nextProps: Object) {
    const { file, userDetails } = nextProps;
    console.log('NextProps: ', nextProps);
    this.setState({ file });
    this.setState({ userInformation: userDetails });
  }

  render() {
    const { file, userInformation } = this.state;
    if (file && !file._id) {
      return <div />;
    }
    const link = cryptr.encrypt(
      `${file._id.toString()}-${
        userInformation._id
      }-${file._provendb_metadata.minVersion.toString()}`,
    );
    let pdocsLink;
    if (DOMAINS.PROVENDOCS_ENV === ENVIRONMENT.PROD || !DOMAINS.PROVENDOCS_ENV) {
      pdocsLink = `https://provendocs.com/share/${link}`;
    } else {
      pdocsLink = `https://${DOMAINS.PROVENDOCS_ENV}.provendocs.com/share/${link}`;
    }

    return (
      <div className="shareProofDialogueWrapper">
        <Icon className="heroIcon" type="link" />
        <h2 className="title">Share Proof</h2>
        <span className="subtitle">
          Below is a link allowing others to view this document along with its proof.
        </span>
        <div className="hr" />
        <span className="publicLink">{pdocsLink}</span>
        <CopyToClipboard text={pdocsLink}>
          <Button
            onClick={() => {
              openNotificationWithIcon('success', 'Copied.', 'Link has been copied to clipboard.');
            }}
          >
            Copy to Clipboard
          </Button>
        </CopyToClipboard>
      </div>
    );
  }
}

export default withRouter(ShareDialog);
