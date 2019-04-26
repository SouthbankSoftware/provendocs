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
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Icon, Button } from 'antd';
import Log from '../../common/log';
// $FlowFixMe
import './ShareDialog.scss';
import { openNotificationWithIcon } from '../../common/util';
import { ENVIRONMENT, DOMAINS } from '../../common/constants';
import { api } from '../../common';
import { Loading } from '../Common';

type Props = {
  file: Object,
};

type State = {
  file: Object,
  link: string,
};

Log.setSource('ShareDialog');

class ShareDialog extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      file: {},
      link: '',
    };
  }

  componentDidMount() {
    this.setState({ file: this.props.file });
    api
      .encryptLink(this.props.file._id, this.props.file._provendb_metadata.minVersion.toString())
      .then((link) => {
        this.setState({ link: link.data });
      })
      .catch((encryptErr) => {
        console.error(encryptErr);
      });
  }

  componentWillReceiveProps(nextProps: Object) {
    const { file } = nextProps;
    this.setState({ file });
    api
      .encryptLink(file._id, file._provendb_metadata.minVersion.toString())
      .then((link) => {
        this.setState({ link: link.data });
      })
      .catch((encryptErr) => {
        console.error(encryptErr);
      });
  }

  render() {
    const { file, link } = this.state;
    if (file && !file._id) {
      return <div />;
    }
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
        {link !== '' && (
          <React.Fragment>
            <span className="subtitle">
              Below is a link allowing others to view this document along with its proof.
            </span>
            <div className="hr" />
            <span className="publicLink">{pdocsLink}</span>
            <CopyToClipboard text={pdocsLink}>
              <Button
                onClick={() => {
                  openNotificationWithIcon(
                    'success',
                    'Copied.',
                    'Link has been copied to clipboard.',
                  );
                }}
              >
                Copy to Clipboard
              </Button>
            </CopyToClipboard>
          </React.Fragment>
        )}
        {link === '' && <Loading />}
      </div>
    );
  }
}

export default withRouter(ShareDialog);
