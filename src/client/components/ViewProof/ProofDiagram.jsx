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
 * @Last modified time: 2019-04-09T16:16:28+10:00
 */

import React from 'react';
// $FlowFixMe
import './ProofDiagram.scss';

type Props = {
  proofInformation: Object,
};

class ProofDiagram extends React.PureComponent<Props> {
  render() {
    const { proofInformation } = this.props;

    const documentStep = (
      stepNum: number,
      stepTitle: string,
      completeContent: any,
      incompleteContent: any,
      isComplete: boolean,
      final?: boolean = false,
    ) => (
      <div className="proofStep">
        <div className="header">
          <div className="icon">IC</div>
          <h3 className="title">{`Step ${stepNum.toString()}: ${stepTitle}`}</h3>
        </div>
        <div className="body">
          <div className={`leftLine final_${final.toString()}`} />
          <div className="content">{isComplete ? completeContent : incompleteContent}</div>
        </div>
      </div>
    );

    return (
      <div className="proofDiagramWrapper">
        <div className="proofSteps">
          {documentStep(
            1,
            'Document',
            <React.Fragment>
              <div className="left">
                <span>Your documents have been uploaded to ProvenDocs.</span>
              </div>
              <div className="right">
                <span>Permanent link to ProvenDocs</span>
              </div>
            </React.Fragment>,
            <React.Fragment>
              <div className="left">
                {' '}
                <span>Your documents are being uploaded to ProvenDocs.</span>
              </div>
              <div className="right">right</div>
            </React.Fragment>,
            true,
            false,
          )}
          {documentStep(
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
                <span>Document Hash</span>
                <span>ChainPoint Anchor</span>
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
            true,
            false,
          )}
          {documentStep(
            3,
            'Blockchain',
            <React.Fragment>
              <div className="left">
                {' '}
                <span>Your document has been anchored on the bitcoin blockchain.</span>
              </div>
              <div className="right">
                <span>Blockchain Block</span>
                <span>Blockchain Transaction ID</span>
                <span>Blockchain Transaction Time</span>
              </div>
            </React.Fragment>,
            <React.Fragment>
              <div className="left">
                {' '}
                <span>Your document is being anchored on the bitcoin blockchain.</span>
              </div>
              <div className="right" />
            </React.Fragment>,
            true,
            true,
          )}
        </div>
      </div>
    );
  }
}

export default ProofDiagram;
