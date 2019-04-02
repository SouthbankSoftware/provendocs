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
