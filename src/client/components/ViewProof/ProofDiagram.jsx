/*
 * @flow
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
 * @Date:   2019-04-09T15:19:41+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-10T15:26:37+10:00
 */

import React from 'react';
import { Icon, Tooltip } from 'antd';
import Cryptr from 'cryptr';
// Icons:
import DocumentIcon from '../../style/icons/pages/dashboard/document-new-icon.svg';
import HashIcon from '../../style/icons/pages/dashboard/hash-icon.svg';
import BlockIcon from '../../style/icons/pages/dashboard/box-icon.svg';
// $FlowFixMe
import './ProofDiagram.scss';
import { PROOF_STATUS } from '../../common/constants';
import { Loading } from '../Common';

const urlEncryptionKey = process.env.PROVENDOCS_SECRET || 'mySecretHere';
const cryptr = new Cryptr(urlEncryptionKey);

type Props = {
  proofInformation: Object,
  file: Object,
  userDetails: Object,
};

type State = {
  proofInformation: Object,
  file: Object,
  userDetails: Object,
};

class ProofDiagram extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      proofInformation: {},
      file: {},
      userDetails: {},
    };
  }

  componentDidMount() {
    const { props } = this;
    const { file, proofInformation, userDetails } = props;
    this.setState({ file });
    this.setState({ proofInformation });
    this.setState({ userDetails });
  }

  componentWillReceiveProps(props: Object) {
    const { file, proofInformation, userDetails } = this.state;
    if (
      file._id !== props.file._id
      || proofInformation !== props.proofInformation
      || userDetails !== props.userDetails
    ) {
      this.setState({ file: props.file });
      this.setState({ proofInformation: props.proofInformation });
      this.setState({ userDetails: props.userDetails });
    }
  }

  render() {
    const { proofInformation, file, userDetails } = this.state;
    if (!file._id) {
      return <Loading isFullScreen={false} />;
    }

    const documentStep = (
      icon: any,
      stepNum: number,
      stepTitle: string,
      completeContent: any,
      incompleteContent: any,
      tooltipText: string,
      isComplete: boolean,
      final?: boolean = false,
    ) => (
      <div className="proofStep">
        <div className="header">
          <div className={`icon isComplete_${isComplete.toString()}`}>{icon}</div>
          <h3 className="title">{`Step ${stepNum.toString()}: ${stepTitle}`}</h3>
          <Tooltip placement="right" title={tooltipText}>
            <Icon type="question-circle" theme="filled" />
          </Tooltip>
        </div>
        <div className="body">
          <div className={`leftLine final_${final.toString()} complete_${isComplete.toString()}`} />
          <div className="content">{isComplete ? completeContent : incompleteContent}</div>
        </div>
      </div>
    );

    let pdocsLink = null;
    if (userDetails._id) {
      const link = cryptr.encrypt(
        `${file._id.toString()}-${
          userDetails._id
        }-${file._provendb_metadata.minVersion.toString()}`,
      );
      pdocsLink = `https://provendocs.com/share/${link}`;
    }

    let provenDateString = 'UNKNOWN';
    let linkDate = 'UNKNOWN';
    if (proofInformation.btcTxnConfirmed) {
      provenDateString = String(new Date(proofInformation.btcTxnConfirmed));
      const date = new Date(Date.parse(proofInformation.btcTxnConfirmed));
      linkDate = date.toISOString().replace(/[-:.Z]/g, '');
    }

    return (
      <div className="proofDiagramWrapper">
        <div className="proofSteps">
          {documentStep(
            <DocumentIcon />,
            1,
            'Document',
            <React.Fragment>
              <div className="left">
                <span>Your documents have been uploaded to ProvenDocs.</span>
              </div>
              <div className="right">
                {pdocsLink && (
                  <Tooltip placement="topLeft" title={pdocsLink}>
                    <a href={pdocsLink} target="_blank" rel="noopener noreferrer">
                      Permanent link to ProvenDocs
                    </a>
                  </Tooltip>
                )}
              </div>
            </React.Fragment>,
            <React.Fragment>
              <div className="left">
                {' '}
                <span>Your documents are being uploaded to ProvenDocs.</span>
              </div>
            </React.Fragment>,
            'Your document is uploaded to the provendocs database along with relevant metadata.',
            proofInformation.status === PROOF_STATUS.SUBMITTED
              || proofInformation.status === PROOF_STATUS.VALID
              || proofInformation.status === PROOF_STATUS.PENDING,
            false,
          )}
          {documentStep(
            <HashIcon />,
            2,
            'Hash',
            <React.Fragment>
              <div className="left">
                {' '}
                <span>
                  Your documents have been hashed and registered on the ChainPoint network.
                </span>
              </div>
              <div className="right">
                <Tooltip placement="topLeft" title={proofInformation.documentHash}>
                  <span target="_blank" rel="noopener noreferrer">
                    Document Hash
                  </span>
                </Tooltip>
              </div>
            </React.Fragment>,
            <React.Fragment>
              <div className="left">
                {' '}
                <span>
                  Your documents are being hashed before being registered on the ChainPoint network.
                </span>
              </div>
              <div className="right" />
            </React.Fragment>,
            'A hash is a compact and unique representation of your document.',
            proofInformation.status === PROOF_STATUS.SUBMITTED
              || proofInformation.status === PROOF_STATUS.VALID,
            false,
          )}
          {documentStep(
            <BlockIcon />,
            3,
            'Blockchain',
            <React.Fragment>
              <div className="left">
                {' '}
                <span>Your document has been anchored on the bitcoin blockchain.</span>
              </div>
              <div className="right">
                <Tooltip placement="topLeft" title={proofInformation.btcBlockNumber}>
                  <a
                    href={`https://live.blockcypher.com/btc/block/${
                      proofInformation.btcBlockNumber
                    }/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Blockchain Block
                  </a>
                </Tooltip>
                <Tooltip placement="topLeft" title={proofInformation.btcTransaction}>
                  <a
                    href={`https://live.blockcypher.com/btc/tx/${proofInformation.btcTransaction}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Blockchain Transaction ID
                  </a>
                </Tooltip>
                {proofInformation.btcTxnConfirmed && (
                  <Tooltip placement="topLeft" title={provenDateString || ''}>
                    <a
                      href={`https://www.timeanddate.com/worldclock/converter.html?iso=${linkDate}&p1=1440&p2=152&p3=136&p4=179&p5=137&p6=33&p7=248`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Blockchain Transaction Time
                    </a>
                  </Tooltip>
                )}
              </div>
            </React.Fragment>,
            <React.Fragment>
              <div className="left">
                {' '}
                <span>Your document is being anchored on the bitcoin blockchain.</span>
              </div>
              <div className="right" />
            </React.Fragment>,
            'The Bitcoin blockchain is where we store an immutable representation of your proof.',
            proofInformation.status === PROOF_STATUS.VALID,
            true,
          )}
        </div>
      </div>
    );
  }
}

export default ProofDiagram;
