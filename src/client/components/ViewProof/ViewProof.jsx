/* @flow
 * @Author: Michael Harrison
 * @Date:   2019-02-19T13:52:47+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-13T14:06:28+11:00
 */

import React from 'react';
import autobind from 'autobind-decorator';
import { Loading, Error } from '../Common';
import TickIcon from '../../style/icons/pages/dashboard/tick-icon.svg';
import CrossIcon from '../../style/icons/pages/dashboard/cross-icon.svg';
import DocumentIcon from '../../style/icons/pages/dashboard/document-icon.svg';
import BlockchainIcon from '../../style/icons/pages/dashboard/blockchain-icon.svg';
import HashIcon from '../../style/icons/pages/dashboard/hash-icon.svg';
import PendingIcon from '../../style/icons/pages/dashboard/uploading-icon.svg';
import InfoIcon from '../../style/icons/pages/dashboard/info-icon.svg';
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
};
type State = {
  file: any;
  fileVersion: number;
  proofInformation: Object;
  currentState: any;
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
    };
  }

  componentWillReceiveProps(props: Object) {
    const { file } = this.state;
    const { setProofCallback } = this.props;
    if (props.file !== null && props.file !== file) {
      this.state.file = props.file;
      this.state.fileVersion = props.fileVersion;
      this.setState({ currentState: STATES.LOADING });
      this._fetchProof()
        .then((proof) => {
          if (proof.data.proofs[0].status) {
            this.setState({ proofInformation: proof.data.proofs[0] });
            if (proof.data.proofs[0].status === PROOF_STATUS.VALID) {
              setTimeout(() => {
                setProofCallback(true);
                this.setState({ currentState: STATES.FILE_PROOF_COMPLETE });
              }, 2000);
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
        })
        .catch((err) => {
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

  @autobind
  _renderProofDiagram() {
    const { proofInformation } = this.state;
    const { status } = proofInformation;
    return (
      <div className="smallProofDiagramWrapper">
        <span className="header">
          <b>Document upload:</b>
          In progress.
        </span>
        <div className="subheader">
          <span>
            {' '}
            Your document is currently being proven, please check back here later to view your
            completed proof.
          </span>
          <InfoIcon
            className="infoIcon"
            onClick={() => {
              window.open('https://provendb.com/concepts/proofs');
            }}
          />
        </div>
        <div className="diagram">
          <div className="steps">
            <div className="document">
              <b>Step 1:</b>
              {' '}
              <span>Document</span>
            </div>
            <div className="hash">
              <b>Step 2:</b>
              {' '}
              <span>Hash</span>
            </div>
            <div className="blockchain">
              <b>Step 3:</b>
              {' '}
              <span>Blockchain</span>
            </div>
          </div>
          <div className="line">
            {status && status === PROOF_STATUS.FAILED && <CrossIcon className="crossIcon" />}
            {status && status === PROOF_STATUS.VALID && <TickIcon className="tickIcon" />}
            {status && (status === PROOF_STATUS.PENDING || status === PROOF_STATUS.SUBMITTED) && (
              <TickIcon className="tickIcon" />
            )}
            <div className="hr" />
            {
              // Below is the Hash status icon.
            }
            {status && status === PROOF_STATUS.FAILED && <CrossIcon className="crossIcon" />}
            {status && (status === PROOF_STATUS.VALID || status === PROOF_STATUS.SUBMITTED) && (
              <TickIcon className="tickIcon" />
            )}
            {status && status === PROOF_STATUS.PENDING && <PendingIcon className="pendingIcon" />}
            <div className="hr" />
            {status && status === PROOF_STATUS.FAILED && <CrossIcon className="crossIcon" />}
            {status && status === PROOF_STATUS.VALID && <TickIcon className="tickIcon" />}
            {status && status === PROOF_STATUS.PENDING && <div className="emptyCircle" />}
            {status && status === PROOF_STATUS.SUBMITTED && <PendingIcon className="pendingIcon" />}
          </div>
          <div className="icons">
            <div className="document">
              {status === PROOF_STATUS.PENDING
              || status === PROOF_STATUS.SUBMITTED
              || status === PROOF_STATUS.VALID ? (
                <DocumentIcon className="documentIcon" />
                ) : (
                  <DocumentIcon className="documentIcon faded" />
                )}
              {status === PROOF_STATUS.PENDING
              || status === PROOF_STATUS.SUBMITTED
              || status === PROOF_STATUS.VALID ? (
                <span>Your documents have been hashed.</span>
                ) : (
                  <span className="faded">First your documents are hashed.</span>
                )}
            </div>
            <div className="hash">
              {status === PROOF_STATUS.SUBMITTED || status === PROOF_STATUS.VALID ? (
                <HashIcon className="hashIcon" />
              ) : (
                <HashIcon className="hashIcon faded" />
              )}
              {status === PROOF_STATUS.SUBMITTED || status === PROOF_STATUS.VALID ? (
                <span>Your documents have been submitted to chainpoint.</span>
              ) : (
                <span>Then your documents are hashed together into one hash by Chainpoint.</span>
              )}
            </div>
            <div className="blockchain">
              {status === PROOF_STATUS.SUBMITTED || status === PROOF_STATUS.VALID ? (
                <BlockchainIcon className="blockchainIcon" />
              ) : (
                <BlockchainIcon className="blockchainIcon faded" />
              )}
              {status === PROOF_STATUS.SUBMITTED || status === PROOF_STATUS.VALID ? (
                <span>Your documents are being anchored on the blockchain</span>
              ) : (
                <span>Finally your merged hash is anchored on the blockchain!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { currentState, file, fileVersion } = this.state;
    switch (currentState) {
      case STATES.FAILED:
        return (
          <div className="viewProof subWrapper">
            <div className="contentWrapper">
              <div className="viewProofWrapper">
                {' '}
                <Error message="Failed to get Proof, sorry!" />
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
              <div className="header">
                <div className="documentTitle">
                  <span className="docMessage" />
                </div>
              </div>
              <div className="body">{this._renderProofDiagram()}</div>
            </div>
          </div>
        );
      case STATES.FILE_PROOF_COMPLETE:
        return (
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
        );
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
