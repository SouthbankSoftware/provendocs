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
    };
  }

  componentDidMount() {
    const { file, fileVersion, history } = this.props;
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
    const { file } = this.state;
    const { history } = this.props;
    if (props.file !== null && props.file !== undefined && props.file !== file) {
      this.state.file = props.file;
      this.state.fileVersion = props.fileVersion;
      this.setState({ currentState: STATES.LOADING });
      if (props.file.type === MIMETYPES.PDF || props.file.mimetype === MIMETYPES.PDF) {
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

  @autobind
  _fetchFile() {
    return new Promise((resolve, reject) => {
      const { file, fileVersion } = this.state;
      if (!fileVersion) {
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
      filePreviewHTML, file, fileVersion, emailExtras,
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
