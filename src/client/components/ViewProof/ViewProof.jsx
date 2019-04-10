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
import autobind from 'autobind-decorator';
import { ProofDiagram } from '../index';
import { Loading } from '../Common';
import PreviewOffIcon from '../../style/icons/pages/dashboard/preview-off-icon.svg';
import { openNotificationWithIcon } from '../../common/util';
import { PROOF_STATUS } from '../../common/constants';
import { api, Log } from '../../common';
// $FlowFixMe
import './ViewProof.scss';

const STATES = {
  SELECT_FILE: 'selectFile',
  FAILED: 'failed',
  LOADING: 'loading',
  FILE_PROOF_PENDING: 'fileProofPending',
  FILE_PROOF_COMPLETE: 'fileProofComplete',
};

type Props = {
  file: Object | null;
  fileVersion: number;
  setProofCallback: any;
  userDetails: Object;
};
type State = {
  file: any;
  fileVersion: number;
  proofInformation: Object;
  currentState: any;
  userDetails: Object;
};

export default class ViewProof extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('ViewProof');
    this.state = {
      file: null,
      fileVersion: 0,
      currentState: STATES.SELECT_FILE,
      proofInformation: {},
      userDetails: {},
    };
  }

  componentWillReceiveProps(props: Object) {
    const { file } = this.state;
    const { setProofCallback } = this.props;
    console.log('a ', props.file !== null && props.file !== undefined && props.file !== file);
    if (props.file !== null && props.file !== undefined && props.file !== file) {
      console.log('b');
      this.state.file = props.file;
      this.state.fileVersion = props.fileVersion;
      this.state.userDetails = props.userDetails;
      this.setState({ currentState: STATES.LOADING });
      this._fetchProof()
        .then((proof) => {
          if (props.file.name !== this.state.file.name) {
            // A new file has been selected, disregard result of this fetch.
            Log.trace('A new file has been selected while proof was fetching, therefore this proof has been disregarded.');
            return;
          }
          console.log('Fetch Proof result for file: ', proof.data);
          if (proof.data.proofs[0].status) {
            this.setState({ proofInformation: proof.data.proofs[0] });
            if (proof.data.proofs[0].status === PROOF_STATUS.VALID) {
              setProofCallback(true);
              this.setState({ currentState: STATES.FILE_PROOF_COMPLETE });
            } else {
              this.setState({ currentState: STATES.FILE_PROOF_PENDING });
              setProofCallback(false);
            }
          } else {
            // No proofs for version yet.
            this.setState({ proofInformation: { status: PROOF_STATUS.PENDING } });
            this.setState({ currentState: STATES.FILE_PROOF_PENDING });
            setProofCallback(false);
          }
        }).catch((err) => {
          this.setState({ currentState: STATES.FAILED });
          Log.error(`Fetch proof error: ${err}`);
          openNotificationWithIcon(
            'error',
            'Proof Error',
            'Failed to fetch proof for file, sorry!',
          );
        });
    }
  }

  @autobind
  _fetchProof() {
    return new Promise<any>((resolve, reject) => {
      const { file, fileVersion } = this.state;

      if (!fileVersion) {
        // Get current Proof.
        api
          .getProofForUser(file._id)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            Log.error(`Fetch proof error: ${err}`);
            reject(err);
          });
      } else {
        api
          .getHistoricalProofInfoForUser(file.name, fileVersion)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  }

  render() {
    const {
      currentState, file, fileVersion, proofInformation, userDetails,
    } = this.state;
    switch (currentState) {
      case STATES.FAILED:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="viewProofWrapper">
                {' '}
                <PreviewOffIcon className="previewOffIcon" />
                <span className="previewOffTitle">
          Preview Unavaliable.
                </span>
                <span className="previewOffMessage">
           Unfortunately we were unable to render a document preview for this file type.
                </span>
              </div>
            </div>
          </div>
        );
      case STATES.SELECT_FILE:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="viewProofWrapper"> Please select a document.</div>
            </div>
          </div>
        );
      case STATES.LOADING:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper loading">
              <Loading isFullScreen={false} message="Fetching Document Proof..." />
            </div>
          </div>
        );
      case STATES.FILE_PROOF_PENDING:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="proofHeader">
                <div className="documentTitle">
                  <span className="bold">
                    <b>Proof Status: </b>
                  </span>
                  <span>{file.name}</span>
                </div>
              </div>
              <div className="body">
                <ProofDiagram userDetails={userDetails} proofInformation={proofInformation} file={file} />
              </div>
            </div>
          </div>
        );
      case STATES.FILE_PROOF_COMPLETE:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="proofHeader">
                <div className="documentTitle">
                  <span className="bold">
                    <b>Proof Status: </b>
                  </span>
                  <span>{file.name}</span>
                </div>
              </div>
              <div className="body">
                <ProofDiagram userDetails={userDetails} proofInformation={proofInformation} file={file} />
              </div>
            </div>
          </div>
        );
        /*         return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="header">
                <div className="documentTitle">Document Proof:</div>
              </div>
              <div className="body">
                {
                  <div className="finishedProofWrapper iframeHolder">
                    {// Current File!
                    file && file._id && !fileVersion && (
                      <iframe
                        title="proofIFrame"
                        src={`/api/proofCertificate/inline/${file._id}#view=fitH`}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                    )}
                    {// Historical File 0 or less?
                    file && file.name && fileVersion <= 0 && (
                      <iframe
                        title="proofIFrame"
                        src={`/api/proofCertificate/inline/${file._id}#view=fitH`}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                    )}
                    {// Historical File greater than 0.
                    (file && file.name && fileVersion && fileVersion > 0) !== undefined && (
                      <iframe
                        title="proofIFrame"
                        src={`/api/historicalProof/inline/${file.name}/${fileVersion}#view=fitH`}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                    )}
                  </div>
                }
              </div>
            </div>
          </div>
        ); */
      default:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="viewProofWrapper"> View Document Placeholder.</div>
            </div>
          </div>
        );
    }
  }
}
