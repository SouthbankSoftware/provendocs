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
import { Button } from 'antd';

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
      isMobile: false,
    };
  }

  componentDidMount() {
    if (this.detectMobile()) {
      this.setState({ isMobile: true });
    }
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

  detectMobile = () => {
    const browser = navigator.userAgent || navigator.vendor || window.opera;
    let check = false;
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        browser,
      )
      || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        browser.substr(0, 4),
      )
    ) check = true;
    return check;
  };

  render() {
    const {
      file, fileVersion, loading, isMobile,
    } = this.state;

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

    if (isMobile) {
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
              <div
                style={{ display: 'flex', 'flex-direction': 'column' }}
                className="finishedProofWrapper mobile"
              >
                <span className="message">
                  Proof Certificate Preview is not currently supported on mobile browsers. Please
                  return on a desktop browser or download your Certificate below.
                </span>
                <Button
                  style={{ border: 'none', color: 'white', 'margin-top': '20px' }}
                  onClick={() => {
                    if (file && file._id && !fileVersion) {
                      window.location.assign(
                        `/api/proofCertificate/download/${file._id}#view=fitH`,
                      );
                    } else if (file && file.name && fileVersion <= 0) {
                      window.location.assign(
                        `/api/proofCertificate/download/${file._id}#view=fitH`,
                      );
                    } else if (file && file.name && fileVersion > 0) {
                      window.location.assign(
                        `/api/historicalProof/download/${file.name}/${fileVersion}#view=fitH`,
                      );
                    } else {
                      console.error('Not enough information for proof.');
                    }
                  }}
                >
                  Download
                </Button>
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
