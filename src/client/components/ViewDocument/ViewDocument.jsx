/* eslint-disable no-useless-escape */
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
import autobind from 'autobind-decorator';
import ReactHtmlParser from 'react-html-parser';
import PreviewOffIcon from '../../style/icons/pages/dashboard/preview-off-icon.svg';
import { ExcelPreview } from '../index';
import { Loading } from '../Common';
import { MIMETYPES } from '../../common/constants';
import { openNotificationWithIcon } from '../../common/util';
import { api, Log } from '../../common';
// $FlowFixMe
import './ViewDocument.scss';

const STATES = {
  SELECT_FILE: 'selectFile',
  LOADING: 'loading',
  FILE_PREVIEW: 'filePreview',
  ERROR: 'error',
};

type Props = {
  file: Object | null;
  fileVersion: number;
  history: any;
};

type State = {
  file: any;
  fileVersion: number;
  filePreviewHTML: any;
  currentState: any;
  isMobile: boolean;
  emailExtras: Object;
};

class ViewDocument extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('ViewDocument');
    this.state = {
      file: null,
      fileVersion: 0,
      currentState: STATES.SELECT_FILE,
      filePreviewHTML: null,
      emailExtras: {},
      isMobile: false,
    };
  }

  componentDidMount() {
    const { file, fileVersion, history } = this.props;
    if (this.detectMobile()) {
      this.setState({ isMobile: true });
    }

    if (file && file.name) {
      this.state.file = file;
      this.state.fileVersion = fileVersion;
      this.setState({ currentState: STATES.LOADING });
      if (file.type === MIMETYPES.PDF || file.mimetype === MIMETYPES.PDF) {
        // Do nothing yet.
        this.setState({ currentState: STATES.FILE_PREVIEW });
      } else {
        this._fetchFile()
          .then((data) => {
            if (file.mimetype === MIMETYPES.EMAIL) {
              if (data.data.subject || data.data.from || data.data.to) {
                const {
                  to, from, cc, subject, attachments,
                } = data.data;
                this.setState({
                  emailExtras: {
                    to,
                    from,
                    cc,
                    subject,
                    attachments,
                  },
                });
              } else {
                this.setState({ emailExtras: {} });
              }
            }
            this.setState({ filePreviewHTML: data.data.content });
            this.setState({ currentState: STATES.FILE_PREVIEW });
          })
          .catch((err) => {
            if (err && err.response && err.response.status === 401) {
              history.push('/login/expired');
            } else {
              openNotificationWithIcon(
                'error',
                'Error Previewing File',
                'Failed to create preview of selected file, sorry!',
              );
              Log.error(`Error fetching file: ${err}`);
              this.setState({
                currentState: STATES.ERROR,
              });
            }
          });
      }
    }
  }

  componentWillReceiveProps(props: Object) {
    const { file, isMobile } = this.state;
    const { history } = this.props;
    if (props.file !== null && props.file !== undefined && props.file !== file) {
      this.state.file = props.file;
      this.state.fileVersion = props.fileVersion;
      this.setState({ currentState: STATES.LOADING });
      if ((props.file.type === MIMETYPES.PDF || props.file.mimetype === MIMETYPES.PDF) && !isMobile) {
        // Do nothing yet.
        this.setState({ currentState: STATES.FILE_PREVIEW });
      } else {
        this._fetchFile()
          .then((data) => {
            if (props.file.mimetype === MIMETYPES.EMAIL) {
              if (data.data.subject || data.data.from || data.data.to) {
                const {
                  to, from, cc, subject, attachments,
                } = data.data;
                this.setState({
                  emailExtras: {
                    to,
                    from,
                    cc,
                    subject,
                    attachments,
                  },
                });
              } else {
                this.setState({ emailExtras: {} });
              }
            }
            this.setState({ filePreviewHTML: data.data.content });
            this.setState({ currentState: STATES.FILE_PREVIEW });
          })
          .catch((err) => {
            if (err && err.response && err.response.status === 401) {
              history.push('/login/expired');
            } else {
              openNotificationWithIcon(
                'error',
                'Error Previewing File',
                'Failed to create preview of selected file, sorry!',
              );
              Log.error(`Error fetching file: ${err}`);
              this.setState({
                currentState: STATES.ERROR,
              });
            }
          });
      }
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

  @autobind
  _fetchFile() {
    return new Promise((resolve, reject) => {
      const { file, fileVersion, isMobile } = this.state;
      if (isMobile && file.mimetype === MIMETYPES.PDF) {
        api
          .getFilePreviewForUser(file._id)
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            openNotificationWithIcon('error', 'Error', 'Failed to get file preview, sorry!');
            Log.error(`Failed to get file preview with error: ${error}`);
            console.error(error);
            reject(error);
          });
      } else if (!fileVersion) {
        api
          .getFullFileForUser(file._id)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        api
          .getFullFileForUserFromHistory(file.name, fileVersion)
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
  _renderFilePreview() {
    const {
      filePreviewHTML, file, fileVersion, emailExtras, isMobile,
    } = this.state;
    const {
      to, from, cc, subject,
    } = emailExtras;
    let attachments;
    if (emailExtras && emailExtras.attachments) {
      attachments = emailExtras.attachments.map(val => val.originalname);
    } else {
      attachments = [''];
    }

    const { mimetype } = file;

    let previewClass = '';
    if (file) {
      switch (file.mimetype) {
        case MIMETYPES.PDF:
          previewClass = 'pdf';
          break;
        case MIMETYPES.PNG:
          previewClass = 'png';
          break;
        case MIMETYPES.JPEG:
          previewClass = 'png';
          break;
        case MIMETYPES.SVG:
          previewClass = 'svg';
          break;
        case MIMETYPES.EMAIL:
          previewClass = 'email';
          break;
        case MIMETYPES.DOC:
        case MIMETYPES.DOCX:
          previewClass = 'docx';
          break;
        case MIMETYPES.XLSX:
          previewClass = 'excel';
          break;
        case MIMETYPES.HTML:
          previewClass = 'html';
          break;
        default:
          previewClass = 'default';
          break;
      }
    }

    switch (mimetype) {
      case MIMETYPES.PDF:
        if (isMobile) {
          return (
            <div className="viewDocumentWrapper iframeHolder">
              <div className="htmlParsed">
                <img src={filePreviewHTML} alt={file.fileName} />
              </div>
            </div>
          );
        }

        if (fileVersion) {
          return (
            <div className="viewDocumentWrapper iframeHolder">
              {file && file.name && (
                <iframe
                  title="proofIFrame"
                  src={`/api/historicalFile/inline/${file.name}/${fileVersion}#view=fitH`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                />
              )}
            </div>
          );
        }
        return (
          <div className="viewDocumentWrapper iframeHolder">
            {file && file._id && (
              <iframe
                title="proofIFrame"
                src={`/api/file/inline/${file._id}#view=fitH`}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            )}
          </div>
        );
      case MIMETYPES.EMAIL:
        return (
          <div className="viewDocumentWrapper">
            {emailExtras && (
            <div className="emailExtras">
              <div className="to">
                <span className="toLabel emailLabel">To: </span>
                <span className="toValue value">{to}</span>
              </div>
              <div className="from">
                <span className="fromLabel emailLabel">From: </span>
                <span className="fromValue value">{from}</span>
              </div>
              <div className="cc">
                <span className="ccLabel emailLabel">CC: </span>
                <span className="ccValue value">{cc}</span>
              </div>
              <div className="subject">
                <span className="subjectLabel emailLabel">Subject: </span>
                <span className="subjectValue value">{subject}</span>
              </div>
              <div className="attachements">
                <span className="attachmentsLabel emailLabel">Attachments: </span>
                <span className="attachmentsValue value">{attachments.join(',  ')}</span>
              </div>
            </div>
            )}
            <div
              className={`${previewClass}`}
              dangerouslySetInnerHTML={{ __html: filePreviewHTML }}
            />
          </div>
        );
      case MIMETYPES.XLSX:
        return (
          <div className="viewDocumentWrapper">
            <ExcelPreview excelData={filePreviewHTML} />
          </div>
        );
      default:
        if (!filePreviewHTML.length) {
          return (
            <div className="viewDocumentWrapper unknownType">
              <PreviewOffIcon className="previewOffIcon" />
              <span className="previewOffTitle">
                Preview Unavaliable.
              </span>
              <span className="previewOffMessage">
                 Unfortunately we were unable to render a document preview for this file type.
              </span>
            </div>
          );
        }
        return (
          <div className="viewDocumentWrapper htmlParsed">
            {/*             <div
              className={`${previewClass}`}
              dangerouslySetInnerHTML={{ __html: filePreviewHTML }}
            /> */}
            <div className="htmlParsed">
              { ReactHtmlParser(filePreviewHTML)}
            </div>
          </div>
        );
    }
  }

  render() {
    const { currentState, file } = this.state;
    switch (currentState) {
      case STATES.ERROR:
        return (
          <div className="viewDocument subWrapper">
            <div className="contentWrapper">
              <div className="viewDocumentWrapper unknownType">
                <PreviewOffIcon className="previewOffIcon" />
                <span className="previewOffTitle">
          Preview Error.
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
          <div className="viewDocument subWrapper">
            <div className="contentWrapper">
              <div className="viewDocumentWrapper"> Please select a document.</div>
            </div>
          </div>
        );
      case STATES.LOADING:
        return (
          <div className="viewDocument subWrapper">
            <div className="contentWrapper">
              <Loading isFullScreen={false} message="Fetching Document Preview..." />
            </div>
          </div>
        );
      case STATES.FILE_PREVIEW:
        return (
          <div className="viewDocument subWrapper">
            <div className="contentWrapper">
              <div className="viewDocumentHeader">
                <div className="documentTitle">
                  <span className="bold">
                    <b>Document Preview: </b>
                  </span>
                  <span>{file.name}</span>
                </div>
              </div>
              {this._renderFilePreview()}
            </div>
          </div>
        );
      default:
        return (
          <div className="viewDocument subWrapper">
            <div className="contentWrapper">
              <div className="viewDocumentWrapper"> View Document Placeholder.</div>
            </div>
          </div>
        );
    }
  }
}
export default withRouter(ViewDocument);
