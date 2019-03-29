/*
 * @flow
 * Created Date: Tuesday August 28th 2018
 * Author: Michael Harrison
 * Last Modified: Friday August 31st 2018 3:24:14 pm
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
import React from 'react';
import { withRouter } from 'react-router';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import { ExcelPreview } from '../index';
import { Loading, Error } from '../Common';
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

  componentWillReceiveProps(props: Object) {
    const { file } = this.state;
    const { history } = this.props;
    if (props.file !== null && props.file !== file) {
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
            <div className="viewDocumentWrapper">
              <Error
                title="Unrecognised File Type!"
                message="We are unable to render a document preview for this file type, sorry!"
              />
            </div>
          );
        }
        return (
          <div className="viewDocumentWrapper">
            <div
              className={`${previewClass}`}
              dangerouslySetInnerHTML={{ __html: filePreviewHTML }}
            />
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
              <Error
                title="Sorry!"
                message="Failed to fetch document preview, please try refreshing the page."
              />
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
                  <span>{_.truncate(file.name, { length: 50 })}</span>
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
