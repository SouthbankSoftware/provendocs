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
 * @Date:   2019-04-10T15:10:32+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-10T15:12:01+10:00
 */
import React from 'react';
import { Loading } from '../Common';
// $FlowFixMe
import './ViewProofCertificate.scss';

type Props = {
  file: Object,
  fileVersion: number,
};
type State = {
  file: Object,
  fileVersion: number,
  loading: boolean,
};

class proofCertificate extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      file: {},
      fileVersion: 0,
      loading: true,
    };
  }

  componentWillReceiveProps(props: Object) {
    const { file } = this.state;
    this.setState({ loading: true });
    if (file._id !== props.file._id || !file._id) {
      this.setState({ file: props.file });
      this.setState({ fileVersion: props.fileVersion });
      this.setState({ loading: false });
    } else {
      setTimeout(() => {
        this.setState({ loading: false });
      }, 0);
    }
  }

  render() {
    const { file, fileVersion, loading } = this.state;
    if (!file || loading) {
      return (
        <div className="viewProofCertificate subWrapper">
          <div className="contentWrapper">
            <div className="proofCertHeader">
              <div className="documentTitle">
                <span className="bold">
                  <b>Proof Certificate: </b>
                </span>
                <span>{file.name}</span>
              </div>
            </div>
            <div className="proofCertBody">
              <div className="finishedProofWrapper iframeHolder">
                <Loading isFullScreen={false} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="viewProofCertificate subWrapper">
        <div className="contentWrapper">
          <div className="proofCertHeader">
            <div className="documentTitle">
              <span className="bold">
                <b>Proof Certificate: </b>
              </span>
              <span>{file.name}</span>
            </div>
          </div>
          <div className="proofCertBody">
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
          </div>
        </div>
      </div>
    );
  }
}

export default proofCertificate;
