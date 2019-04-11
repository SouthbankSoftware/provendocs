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
import Timestamp from 'react-timestamp';
import SplitPane from 'react-split-pane';
import PreviewOffIcon from '../../style/icons/pages/dashboard/preview-off-icon.svg';
import { ExcelPreview, TopNavBar } from '../index';
import { PAGES, MIMETYPES, PROOF_STATUS } from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
import { Loading, Error } from '../Common';
import { convertBytes, openNotificationWithIcon } from '../../common/util';
import { api, Log } from '../../common';
// $FlowFixMe
import './Dashboard.scss';
// $FlowFixMe
import './SharedDocument.scss';
import ProofDiagram from '../ViewProof/ProofDiagram';

type Props = {
  history: any;
  match: any;
};
type State = {
  size: Object;
  filePreview: any;
  loading: boolean;
  proofLoading: boolean;
  fileName: string;
  proofDate: 'UNKNOWN';
  isAuthenticated: boolean;
  mimetype: any;
  fileId: any;
  metadata: any;
  emailExtras: any;
  fileSize: number;
  documentProof: Object;
};

class SharedDocument extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('SharedDocument');
    this.state = {
      size: { width: 400, height: 200 },
      loading: true,
      proofLoading: true,
      fileName: 'UNKNOWN',
      fileSize: 0,
      proofDate: 'UNKNOWN',
      isAuthenticated: false,
      fileId: null,
      metadata: null,
      mimetype: null,
      filePreview: null,
      emailExtras: {},
      documentProof: {},
    };
  }

  componentDidMount() {
    const { match, history } = this.props;
    const { params } = match;
    const { link } = params;
    window.addEventListener('resize', this._updateDimensions);
    // Check normal authentication.
    checkAuthentication()
      .then((response: any) => {
        if (response.status === 200) {
          // Check if user has shared access to this file,
          api
            .checkSharedAccess(link)
            .then((result) => {
              this.setState({ fileName: result.data.fileName });
              this.setState({ fileId: result.data.fileId });
              this.setState({ metadata: result.data.metaData });
              this.setState({ mimetype: result.data.mimetype });
              this.setState({ proofDate: result.data.proofDate });
              this.setState({ fileSize: result.data.size });
              this.setState({ documentProof: result.data.documentProof });
              this.setState({ proofLoading: false });
              if (result.data.mimetype !== MIMETYPES.PDF) {
                // Can't display in IFRAME, therefore fetch a preview.
                this._fetchFilePreview(
                  result.data.fileName,
                  result.data.metaData.minVersion,
                  result.data.fileId,
                )
                  .then((fetchPreviewResult) => {
                    if (result.data.mimetype === MIMETYPES.EMAIL) {
                      if (
                        fetchPreviewResult.data.subject
                        || fetchPreviewResult.data.from
                        || fetchPreviewResult.data.to
                      ) {
                        const {
                          to, from, cc, subject, attachments,
                        } = fetchPreviewResult.data;
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
                    this.setState({ filePreview: fetchPreviewResult.data.content });
                    // Fetch the file using the ID
                    this.setState({ loading: false });
                  })
                  .catch((fetchPreviewErr) => {
                    Log.info(`Failed to fetch file preview with err: ${fetchPreviewErr}`);
                    openNotificationWithIcon(
                      'error',
                      'Error Getting Preview',
                      'Failed to generate a preview for this file, sorry!',
                    );
                    this.setState({ loading: false });
                  });
              } else {
                this.setState({ loading: false });
              }
            })
            .catch((err) => {
              Log.info(`Failed to fetch file preview with err: ${err}`);
              openNotificationWithIcon(
                'error',
                'Error Getting Preview',
                'Failed to generate a preview for this file, sorry!',
              );
              this.setState({ isAuthenticated: true });
              history.push('/unknown');
            });
          this.setState({ isAuthenticated: true });
        } else if (response.response.status === 400) {
          this.setState({ isAuthenticated: true });
          history.push('/login/expired');
        }
      })
      .catch(() => {
        this.setState({ isAuthenticated: true });
        history.push('/login/expired');
      });
  }

  componentDidUpdate() {
    const { size } = this.state;
    // $FlowFixMe
    const height = document.getElementById('lowerGroup').clientHeight;
    // $FlowFixMe
    const width = document.getElementById('lowerGroup').clientWidth;
    size.height = height;
    size.width = width;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._updateDimensions);
  }

  @autobind
  _updateDimensions() {
    const newSize = {};
    // $FlowFixMe
    const height = document.getElementById('lowerGroup').clientHeight;
    // $FlowFixMe
    let width = document.getElementById('lowerGroup').clientWidth;
    if (width <= 1200) {
      width = 1200;
    }
    newSize.height = height;
    newSize.width = width;
    this.setState({ size: newSize });
  }

  @autobind
  // eslint-disable-next-line
  _fetchFilePreview(fileName: string, fileVersion: number, fileId: string) {
    return new Promise((resolve, reject) => {
      const { match } = this.props;
      const { params } = match;
      const { link } = params;
      api
        .getSharedFile(link)
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  @autobind
  _renderFilePreview() {
    const {
      filePreview, mimetype, emailExtras, fileId, fileName,
    } = this.state;
    const { match } = this.props;
    const { params } = match;
    const { link } = params;

    if (!filePreview && mimetype !== MIMETYPES.PDF) {
      return (
        <div className="viewDocumentWrapper unknownType">
          <PreviewOffIcon className="previewOffIcon" />
          <span className="previewOffTitle">Preview Unavaliable.</span>
          <span className="previewOffMessage">
            Unfortunately we were unable to render a document preview for this file type.
          </span>
        </div>
      );
    }
    const {
      to, from, cc, subject,
    } = emailExtras;
    let attachments;
    if (emailExtras && emailExtras.attachments) {
      attachments = emailExtras.attachments.map(val => val.originalname);
    } else {
      attachments = [''];
    }

    let previewClass = '';
    if (fileId) {
      switch (mimetype) {
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

        return (
          <div className="viewDocumentWrapper iframeHolder">
            {fileName && (
            <iframe
              title="proofIFrame"
              src={`/api/getSharedFile/${link}#view=fitH`}
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
            <div className={`${previewClass}`} dangerouslySetInnerHTML={{ __html: filePreview }} />
          </div>
        );
      case MIMETYPES.XLSX:
        return (
          <div className="viewDocumentWrapper">
            <ExcelPreview excelData={filePreview} />
          </div>
        );
      default:
        if (!filePreview.length) {
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
            <div className={`${previewClass}`} dangerouslySetInnerHTML={{ __html: filePreview }} />
          </div>
        );
    }
  }

  render() {
    const { isAuthenticated } = this.state;
    const { match } = this.props;
    const { params } = match;
    const { link } = params;

    if (isAuthenticated === false) {
      return (
        <div className="App">
          <div className="AppBody">
            <div className="mainPanel">
              <Loading isFullScreen message="Loading, Please wait..." />
            </div>
          </div>
        </div>
      );
    }

    const {
      size, loading, fileName, proofDate, fileSize, proofLoading, documentProof, metadata, fileId,
    } = this.state;

    const sizeResult = convertBytes(fileSize, 'b', 3);
    console.log(documentProof);
    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.SHARED} isAuthenticated onEarlyAccess={false} userDetailsCallback={() => {}} />
        <div className="AppBody">
          <div className="mainPanel sharedDocument">
            <div className="pageTitle">
              <div className="left">
                <span className="title">
                  {' '}
                  Document Proof
                  {' '}
                  <span className="fileTitle">{` / ${fileName}`}</span>
                </span>
              </div>
              <div className="right">
                <div className="fileSize">
                  <span className="bold">File Size: </span>
                  <span>{`${sizeResult.value} ${sizeResult.unit}`}</span>
                </div>
                <div className="vr" />
                <div className="fileUploadDate">
                  <span className="bold">Upload Date: </span>
                  <Timestamp time={proofDate} format="full" />
                </div>
              </div>
            </div>
            <div className="lowerGroup" id="lowerGroup">
              <SplitPane
                split="vertical"
                minSize={size.width / 4}
                maxSize={(size.width / 4) * 3}
                defaultSize={size.width / 2}
              >
                <div className="lhs">
                  <div className="viewDocument subWrapper">
                    <div className="contentWrapper">
                      <div className="topLevelHeader">
                        <div className="documentTitle">
                          <b>Document Preview: </b>
                        </div>
                      </div>
                      {loading && (
                        <div className="viewDocumentWrapper">
                          <Loading isFullScreen={false} message="Fetching Document Preview..." />
                        </div>
                      )}
                      {!loading && this._renderFilePreview()}
                    </div>
                  </div>
                </div>
                <div className="rhs">
                  <div className="viewDocument subWrapper">
                    <div className="contentWrapper">
                      <div className="topLevelHeader">
                        <div className="documentTitle">
                          <b>Blockchain Proof</b>
                        </div>
                      </div>
                      <div className="topLevelBody iframeHolder">
                        {proofLoading && (
                          <Loading isFullScreen={false} message="Fetching Document Proof..." />
                        )}
                        {!proofLoading && documentProof && documentProof.status === PROOF_STATUS.VALID && (
                          <iframe
                            title="proofIFrame"
                            src={`/api/getSharedProof/${link}`}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                          />
                        )}
                        {!proofLoading
                          && documentProof
                          && documentProof.status !== PROOF_STATUS.VALID
                          && <ProofDiagram proofInformation={documentProof} file={{ _id: fileId, _provendb_metadata: metadata }} userDetails={{}} />}
                      </div>
                    </div>
                  </div>
                </div>
              </SplitPane>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(SharedDocument);
