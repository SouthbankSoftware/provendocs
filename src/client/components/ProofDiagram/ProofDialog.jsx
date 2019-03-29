/*
 * @flow
 * Created Date: Saturday September 29th 2018
 * Author: Michael Harrison
 * Last Modified: Tuesday October 9th 2018 9:54:52 am
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
import React from 'react';
import { withRouter } from 'react-router';
import { Dialog } from '@blueprintjs/core';
import { Button } from 'antd';
import autobind from 'autobind-decorator';
import ProofDiagram from './ProofDiagram';
import { api } from '../../common';
import Log from '../../common/log';
import { Loading, Error } from '../Common';
// $FlowFixMe
import './ProofDiagram.scss';
import { PROOF_STATUS, ANTD_BUTTON_TYPES } from '../../common/constants';

Log.setSource('proofDialog');

const STATES = {
  SELECT_FILE: 'selectFile',
  LOADING: 'loading',
  FILE_PROOF_PENDING: 'fileProofPending',
  FILE_PROOF_COMPLETE: 'fileProofComplete',
  FAILED: 'failed',
};

type Props = {
  file: any;
  onClose: any;
  isOpen: any;
  fileVersion: number;
  history: any;
};

type State = {
  currentState: string;
  proofInformation: any;
  fileId: string;
};

class ProofDialog extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      proofInformation: null,
      currentState: STATES.LOADING,
      fileId: '',
    };
  }

  componentDidMount() {
    const { history, file } = this.props;
    this.setState({ currentState: STATES.LOADING });
    this.setState({ fileId: file._id });
    this._fetchProof()
      .then((proof) => {
        // Create a public link for the file?
        this.setState({ proofInformation: proof.data });
        if (proof.data.status === PROOF_STATUS.VALID) {
          this.setState({ currentState: STATES.FILE_PROOF_COMPLETE });
        } else {
          this.setState({ currentState: STATES.FILE_PROOF_PENDING });
        }
      })
      .catch((err) => {
        if (err && err.response && err.response.status === 401) {
          history.push('/login/expired');
        }
        this.setState({ currentState: STATES.FAILED });
      });
  }

  componentWillReceiveProps(nextProps: Object) {
    const { fileId } = this.state;
    if (nextProps.file._id && nextProps.file._id !== fileId) {
      const { history } = this.props;
      this.setState({ currentState: STATES.LOADING });
      this.setState({ fileId: nextProps.file._id });
      this._fetchProof()
        .then((proof) => {
          // Create a public link for the file?
          this.setState({ proofInformation: proof.data });
          if (proof.data.status === PROOF_STATUS.VALID) {
            this.setState({ currentState: STATES.FILE_PROOF_COMPLETE });
          } else {
            this.setState({ currentState: STATES.FILE_PROOF_PENDING });
          }
        })
        .catch((err) => {
          if (err && err.response && err.response.status === 401) {
            history.push('/login/expired');
          }
          this.setState({ currentState: STATES.FAILED });
        });
    }
  }

  @autobind
  _fetchProof() {
    return new Promise((resolve, reject) => {
      const { file, fileVersion } = this.props;
      if (!fileVersion || fileVersion <= 0) {
        api
          .getProofForUser(file._id)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
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
    const { currentState, proofInformation } = this.state;
    const { file, isOpen, onClose } = this.props;
    if (currentState === STATES.LOADING) {
      return (
        <Dialog isOpen={isOpen} onClose={onClose} className="proofDialog">
          <div className="header">
            <div className="left">
              <span>
                <b>Upload Summary: </b>
                {file && file.name}
              </span>
            </div>
            <div className="right">{file && file.uploadedAt}</div>
          </div>
          <div className="body loading">
            <Loading color="#2f79a3" isFullScreen={false} message="Fetching proof information..." />
          </div>
          <div className="footer">
            <div className="right">
              <Button
                className="blueButton close"
                type={ANTD_BUTTON_TYPES.DANGER}
                onClick={onClose}
                text="Close"
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      );
    }
    if (currentState === STATES.FAILED) {
      return (
        <Dialog isOpen={isOpen} onClose={onClose} className="proofDialog">
          <div className="header">
            <div className="left">
              <span>
                <b>Upload Summary: </b>
                {file && file.name}
              </span>
            </div>
            <div className="right">{file && file.uploadedAt}</div>
          </div>
          <div className="body">
            <Error message="Failed to create Proof Dialog, sorry!" />
          </div>
          <div className="footer">
            <div className="right">
              <Button
                className="blueButton close"
                onClick={onClose}
                type={ANTD_BUTTON_TYPES.DANGER}
                text="Close"
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      );
    }
    return (
      <Dialog isOpen={isOpen} onClose={onClose} className="proofDialog">
        <div className="header">
          <div className="left">
            <span>
              <b>Upload Summary: </b>
              {file && file.name}
            </span>
          </div>
          <div className="right">{file && file.uploadedAt}</div>
        </div>
        <div className="body">
          <ProofDiagram file={file} proof={proofInformation} />
        </div>
        <div className="footer">
          <div className="right">
            <Button
              className="blueButton close"
              onClick={onClose}
              type={ANTD_BUTTON_TYPES.DANGER}
              text="Close"
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default withRouter(ProofDialog);
