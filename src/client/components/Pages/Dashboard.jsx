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
 * @Date:   2018-10-29T20:03:41+11:00
 * @Last modified by:   wahaj
 * @Last modified time: 2019-04-10T16:33:14+10:00
 */

import React from 'react';
import ReactGA from 'react-ga';
import { withRouter } from 'react-router';
import { Switch, Tooltip, Position } from '@blueprintjs/core';
import _ from 'lodash';
import SplitPane from 'react-split-pane';
import { Button, Modal } from 'antd';
import Cookies from 'universal-cookie';
import {
  ShareDialog,
  CommentAndTags,
  TopNavBar,
  ProofInProgress,
  ProofComplete,
  ProofCertificate,
} from '../index';
import { convertBytes, openNotificationWithIcon } from '../../common/util';
import { api } from '../../common';
import Log from '../../common/log';
import {
  TabbedPanel, EmailProofButton, NewFileUpload, ViewFiles,
} from '../Dashboard/index';
import {
  PAGES, ANTD_BUTTON_TYPES, GA_CATEGORIES, PROOF_STATUS, ENVIRONMENT,
} from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
import { Loading } from '../Common';
import ViewDocsIcon from '../../style/icons/pages/dashboard/dashboard-icon.svg';
import DocumentIcon from '../../style/icons/pages/dashboard/document-new-icon.svg';
import UploadCompleteIcon from '../../style/icons/pages/dashboard/upload-prompt-icon.svg';
import PlusIcon from '../../style/icons/pages/dashboard/upload-icon.svg';
import ArrowIcon from '../../style/icons/pages/upload-file-folder-pages/arrow.svg';
import HistoryIcon from '../../style/icons/pages/dashboard/merkle-tree-icon.svg';
import EmailIcon from '../../style/icons/pages/dashboard/email-icon.svg';
import LinkIcon from '../../style/icons/pages/dashboard/link-icon.svg';
import ViewProofIcon from '../../style/icons/pages/dashboard/proof-progress-icon.svg';
import PreviewDocumentIcon from '../../style/icons/pages/dashboard/preview-icon.svg';
import DownloadAltIcon from '../../style/icons/pages/dashboard/download-icon-alt.svg';
import DownloadIcon from '../../style/icons/pages/dashboard/download-icon.svg';
import CertificateIcon from '../../style/icons/pages/dashboard/certificate-icon.svg';
import ViewDocument from '../ViewDocument/ViewDocument';
import ViewProof from '../ViewProof/ViewProof';

// $FlowFixMe
import './Dashboard.scss';

const cookies = new Cookies();
const { confirm } = Modal;

const LHS_TABS = {
  VIEW_DOCUMENTS: 'viewDocs',
  NEW_UPLOAD: 'uploadDoc',
};
const RHS_TABS = {
  VIEW_PROOF: 'viewProof',
  VIEW_DOCUMENT: 'viewDoc',
  VIEW_CERTIFICATE: 'viewCertificate',
};

export const RHS_STAGES = {
  BEGIN: 'begin',
  FILES_EXCEEDING: 'files_exceeding',
  DOCUMENT_MATCHING: 'document_matching',
  LOADING: 'loading',
  SELECT_FILE: 'selectFile',
  FILE_PREVIEW: 'filePreview',
  COMMENT: 'comment',
};

type Props = { history: any };
type State = {
  isAuthenticated: boolean,
  storageUsed: number,
  documentsUsed: number,
  storageLimit: number,
  documentsLimit: number,
  userDetails: Object,
  comment: string,
  allUploadsInvalid: boolean,
  commentTags: Array<string>,
  lhsTabSelected: string,
  rhsTabSelected: string,
  fileSelected: any,
  fileVersion: number,
  rhsStage: string,
  proofReady: boolean,
  firstUploadDialogueOpen: boolean,
  firstProofDialogueOpen: boolean,
  storageLimitReached: boolean,
  shareDialogIsOpen: boolean,
  matchingFiles: Array<Object>,
  failedFiles: Array<string>,
  size: Object,
  checkAll: boolean,
};

Log.setSource('Dashboard');
class Dashboard extends React.Component<Props, State> {
  constructor() {
    super();

    this.state = {
      isAuthenticated: false,
      storageUsed: 0,
      documentsUsed: 0,
      storageLimit: 0,
      documentsLimit: 0,
      userDetails: {},
      comment: '',
      allUploadsInvalid: false,
      commentTags: [],
      lhsTabSelected: LHS_TABS.VIEW_DOCUMENTS,
      rhsTabSelected: RHS_TABS.VIEW_DOCUMENT,
      fileSelected: null,
      fileVersion: 0, // 0 means current.
      rhsStage: RHS_STAGES.BEGIN,
      proofReady: false,
      firstUploadDialogueOpen: false,
      firstProofDialogueOpen: false,
      shareDialogIsOpen: false,
      matchingFiles: [],
      failedFiles: [],
      size: { width: 400, height: 200 },
      checkAll: true,
      storageLimitReached: false,
    };

    // $FlowFixMe
    this.rhsTabExtras = (
      <div className="rhsExtras">
        <HistoryIcon className="historyIcon" />
        <div className="vr" />
        <EmailIcon className="emailIcon" />
        <div className="vr" />
        <LinkIcon className="linkIcon" />
      </div>
    );
  }

  componentDidMount() {
    const { history } = this.props;
    window.addEventListener('resize', this._updateDimensions);
    checkAuthentication()
      .then((response: any) => {
        if (response.status === 200) {
          setTimeout(() => {
            this.setState({ isAuthenticated: true });
            api
              .getFileSizeForUser()
              .then((res) => {
                Log.info(res);
                if (res.status === 200) {
                  if (res.data.filesSize[0]) {
                    const checkGrowsurfInterval = setInterval(() => {
                      if (window && window.growsurf && window.growsurf.getParticipantById) {
                        window.growsurf
                          .addParticipant(res.data.email)
                          .then((participant) => {
                            Log.info(`Added participant to Growsurf: ${participant}.`);
                          })
                          .catch((growSurfErr) => {
                            Log.error(`Error adding participant: ${JSON.stringify(growSurfErr)}`);
                          });
                        clearInterval(checkGrowsurfInterval);
                      }
                    }, 1000);
                    this.setState({ storageUsed: res.data.filesSize[0].storageUsed });
                    this.setState({ documentsUsed: res.data.filesSize[0].documentsUsed });
                    this.setState({ storageLimit: res.data.filesSize[0].storageLimit });
                    this.setState({ documentsLimit: res.data.filesSize[0].documentsLimit });
                  } else {
                    const checkGrowsurfInterval = setInterval(() => {
                      if (window && window.growsurf && window.growsurf.getParticipantById) {
                        window.growsurf
                          .addParticipant(res.data.email)
                          .then((participant) => {
                            Log.info(`Added participant to Growsurf: ${participant}.`);
                          })
                          .catch((growSurfErr) => {
                            Log.error(`Error adding participant: ${JSON.stringify(growSurfErr)}`);
                          });
                        clearInterval(checkGrowsurfInterval);
                      }
                    }, 1000);
                    this.setState({ storageUsed: res.data.filesSize.storageUsed });
                    this.setState({ documentsUsed: res.data.filesSize.documentsUsed });
                    this.setState({ storageLimit: res.data.filesSize.storageLimit });
                    this.setState({ documentsLimit: res.data.filesSize.documentsLimit });
                  }
                }
              })
              .catch((err) => {
                Log.error(`Error fetching files size: ${err}`);
                openNotificationWithIcon(
                  'error',
                  'File List Error',
                  'Failed to get files size, sorry.',
                );
              });
          }, 1000);
        } else if (response.response.status === 400) {
          this.setState({ isAuthenticated: true });
          history.push('/login/expired');
        }
      })
      .catch(() => {
        this.setState({ isAuthenticated: false });
        history.push('/login/expired');
      });
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  componentDidUpdate() {
    const { size } = this.state;
    if (document && document.getElementById('lowerGroup')) {
      // $FlowFixMe
      const height = document.getElementById('lowerGroup').clientHeight;
      // $FlowFixMe
      const width = document.getElementById('lowerGroup').clientWidth;
      size.height = height;
      size.width = width;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._updateDimensions);
  }

  /**
   * Sets whether or not the storage limit has been reached.
   */
  _setStorageLimitReached = (storageReached: boolean) => {
    this.setState({
      storageLimitReached: storageReached,
    });
  };

  /**
   * Callback function for setting user details when found later.
   */
  _setUserDetails = (userDetails: Object) => {
    this.setState({
      userDetails,
    });
  };

  /**
   * Refresh the storage usage, after a forget is issues.
   */
  _refreshFileSize = () => {
    api
      .getFileSizeForUser()
      .then((res) => {
        this.setState({ storageUsed: res.data[0].storageUsed });
        this.setState({ documentsUsed: res.data[0].documentsUsed });
        this.setState({ storageLimit: res.data[0].storageLimit });
        this.setState({ documentsLimit: res.data[0].documentsLimit });
      })
      .catch((err) => {
        Log.error(`Error fetching files size: ${err}`);
        openNotificationWithIcon('error', 'File List Error', 'Failed to get files size, sorry.');
      });
  };

  _checkAndShowFirstUploadDialogue = () => {
    if (
      cookies.get('provendocs_upload_dont_remind_me') === 'false'
      || cookies.get('provendocs_upload_dont_remind_me') === undefined
    ) {
      this.setState({ firstUploadDialogueOpen: true });
    }
  };

  _checkAuth = () => new Promise((resolve, reject) => {
    window.addEventListener('resize', this._updateDimensions);
    checkAuthentication()
      .then((response: any) => {
        if (response.status === 200) {
          resolve();
        } else if (response.response.status === 400) {
          this.setState({ isAuthenticated: true });
          reject();
        }
      })
      .catch(() => {
        this.setState({ isAuthenticated: false });
        reject();
      });
  });

  _updateDimensions = () => {
    const newSize = {};
    // $FlowFixMe
    const height = document.getElementById('lowerGroup').clientHeight;
    // $FlowFixMe
    let width = document.getElementById('lowerGroup').clientWidth;
    if (width <= 1280) {
      width = 1280;
    }
    newSize.height = height;
    newSize.width = width;
    this.setState({ size: newSize });
  };

  _setAuthenticated = (authenticated: boolean) => {
    this.setState({ isAuthenticated: authenticated });
  };

  _swapLHSTab = (uploadComplete: boolean) => {
    const { lhsTabSelected } = this.state;
    // const { viewDocs } = this.refs;
    const { viewDocs } = this;
    if (lhsTabSelected === LHS_TABS.VIEW_DOCUMENTS) {
      this.setState({ lhsTabSelected: LHS_TABS.NEW_UPLOAD });
    } else {
      this.setState({ lhsTabSelected: LHS_TABS.VIEW_DOCUMENTS });
    }
    viewDocs.getFileList(true);
    if (uploadComplete) {
      this._checkAndShowFirstUploadDialogue();
    }
  };

  _fileSelected = (file: Object, fileVersion: number) => {
    const { rhsTabSelected } = this.state;
    if (!file) return; // Check new file exists.
    if (rhsTabSelected === RHS_TABS.VIEW_CERTIFICATE && file.proofInfo !== PROOF_STATUS.VALID) {
      // Check if viewing cert, new file has cert.
      this.setState({ rhsTabSelected: RHS_TABS.VIEW_PROOF });
    }
    if (
      file.proofInfo === PROOF_STATUS.VALID
      && (cookies.get('provendocs_proof_dont_remind_me') === 'false'
        || cookies.get('provendocs_proof_dont_remind_me') === undefined)
    ) {
      // If cookie is set, show dialog.
      this.setState({ firstProofDialogueOpen: true });
    }
    this.setState({ proofReady: false });
    this.state.fileVersion = fileVersion;
    this.setState({ fileSelected: file });
  };

  _setTab = (newTabId: string) => {
    this.setState({ lhsTabSelected: newTabId });
  };

  _setRHSTab = (newTabId: string) => {
    this.setState({ rhsTabSelected: newTabId });
  };

  _setStage = (newStage: string) => {
    this.setState({ rhsStage: newStage });
  };

  _onClickContinue = (comment?: string, commentTags?: Array<any>) => {
    // Resume LHS Upload with new list.
    const { newFileUpload } = this;
    const { matchingFiles, rhsStage } = this.state;
    switch (rhsStage) {
      case RHS_STAGES.FILES_EXCEEDING:
        newFileUpload.continue();
        break;
      case RHS_STAGES.DOCUMENT_MATCHING:
        newFileUpload.continue(matchingFiles);
        break;
      case RHS_STAGES.COMMENT:
        this._showConfirmUploadDialog(comment, commentTags);
        break;
      default:
        break;
    }
  };

  _onClickCancel = () => {
    const { newFileUpload } = this;
    this.state.comment = '';
    this.state.commentTags = [];
    newFileUpload.onClickCancel();
  };

  _renderNewUploadRHS = () => {
    const {
      rhsStage,
      matchingFiles,
      failedFiles,
      checkAll,
      allUploadsInvalid,
      storageLimitReached,
    } = this.state;

    const rows = [];
    for (let i = 0; i < failedFiles.length; i += 1) {
      // note: we add a key prop here to allow react to uniquely identify each
      // element in this array. see: https://reactjs.org/docs/lists-and-keys.html
      rows.push(<li>{failedFiles[i]}</li>);
    }
    switch (rhsStage) {
      case RHS_STAGES.BEGIN:
        return (
          <div className="newUploadRHSWrapper">
            <div className="centerContent">
              <ArrowIcon className="arrowIcon" />
              <span className="arrowText">Select or upload a document to begin.</span>
            </div>
          </div>
        );
      case RHS_STAGES.FILES_EXCEEDING:
        return (
          <div className="newUploadRHSWrapper">
            <div className="centerContent">
              <span className="fileError">
                <span className="messageText">
                  Sorry, the following files could not be uploaded because they exceed the 16 MB
                  limit.
                </span>
                <ul className="failedFileList">{rows}</ul>
              </span>
            </div>
            <div className="footerButtons">
              <Button
                text="Cancel"
                type={ANTD_BUTTON_TYPES.PRIMARY}
                className="cancelButton blueButton"
                onClick={this._onClickCancel}
              >
                Cancel
              </Button>
              {!allUploadsInvalid && (
                <Button
                  text="Ok"
                  type={ANTD_BUTTON_TYPES.PRIMARY}
                  className="continueButton whiteButton"
                  onClick={this._onClickContinue}
                >
                  Ok
                </Button>
              )}
            </div>
          </div>
        );
      case RHS_STAGES.DOCUMENT_MATCHING:
        return (
          <div className="newUploadRHSWrapper">
            <span className="messageText">
              You have already loaded a document with this name. Do you want to create new document,
              or a new version of the existing document?
            </span>

            <div className="duplicateList">
              <div className="checkAll">
                {matchingFiles.length > 1 && (
                  <div className={`duplicateSwitch checked_${checkAll.toString()}`}>
                    <span className="noLabel">New Document </span>
                    <Switch
                      label="New Version"
                      checked={checkAll}
                      onChange={() => {
                        this.state.checkAll = !checkAll;
                        let swapTo = false;
                        if (!checkAll) {
                          swapTo = true;
                        }
                        matchingFiles.forEach((item) => {
                          item.isDupe = swapTo;
                        });
                        this.forceUpdate();
                      }}
                    />
                  </div>
                )}
              </div>
              {matchingFiles.map(item => (
                <div className={`duplicateItem checked_${item.isDupe}`}>
                  <div className="duplicateName">{item.name}</div>
                  <div className="duplicateSwitch">
                    <span className="noLabel">New Document </span>
                    <Switch
                      label="New Version"
                      checked={item.isDupe}
                      onChange={() => {
                        item.isDupe = !item.isDupe;
                        this.forceUpdate();
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="footerButtons">
              <Button
                text="Cancel"
                type={ANTD_BUTTON_TYPES.PRIMARY}
                className="cancelButton blueButton"
                onClick={this._onClickCancel}
              >
                Cancel
              </Button>
              <Button
                text="Continue"
                type={ANTD_BUTTON_TYPES.PRIMARY}
                className="continueButton whiteButton"
                onClick={this._onClickContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        );
      case RHS_STAGES.LOADING:
        return (
          <div className="newUploadRHSWrapper">
            <div className="centerContent">
              <Loading isFullScreen={false} message="Loading, Please Wait..." />
            </div>
          </div>
        );
      case RHS_STAGES.COMMENT:
        return (
          <CommentAndTags
            storageLimitReached={storageLimitReached}
            onClickContinue={this._onClickContinue}
            onClickCancel={this._onClickCancel}
          />
        );
      default:
        return <div />;
    }
  };

  _downloadArchiveRHS = () => {
    const { fileSelected, fileVersion } = this.state;
    const { history } = this.props;
    this._checkAuth()
      .then(() => {
        if (fileSelected) {
          if (fileSelected._provendb_metadata) {
            window.open(`/api/util/getArchive/${fileSelected.name}/${fileVersion}`);
          } else {
            window.open(`/api/util/getArchive/${fileSelected.name}/${fileVersion}`);
          }
        }
      })
      .catch(() => {
        history.push('/login/expired');
      });
  };

  _downloadFileRHS = () => {
    const { fileSelected } = this.state;
    const { history } = this.props;
    this._checkAuth()
      .then(() => {
        if (fileSelected && fileSelected._provendb_metadata) {
          if (fileSelected._provendb_metadata) {
            window.open(
              `/api/historicalFile/download/${fileSelected.name}/${
                fileSelected._provendb_metadata.minVersion
              }`,
            );
          } else {
            window.open(`/api/file/inline/${fileSelected._id}#view=fitH`);
          }
        }
      })
      .catch(() => {
        history.push('/login/expired');
      });
  };

  _onShareDialogIsClosed = () => {
    this.setState({ shareDialogIsOpen: false });
  };

  _createLinkRHS = () => {
    const { history } = this.props;
    this._checkAuth()
      .then(() => {
        this.setState({ shareDialogIsOpen: true });
      })
      .catch(() => {
        history.push('/login/expired');
      });
  };

  _showConfirmUploadDialog = (comment?: string, commentTags?: Array<any>) => {
    const { newFileUpload } = this;
    confirm({
      title: (
        <div>
          <UploadCompleteIcon className="uploadIcon" />
          <span>Upload Documents.</span>
        </div>
      ),
      content: "Are you sure you'd like to continue to upload?\n You cannot reverse this option.",
      okText: 'Upload',
      okType: 'success',
      cancelText: 'Cancel',
      cancelType: 'warning',
      onOk() {
        ReactGA.event({
          category: GA_CATEGORIES.DASHBOARD,
          action: 'Upload Documents',
          label: 'Button',
        });
        newFileUpload.duplicateUpload(comment, commentTags);
      },
      onCancel() {},
    });
  };

  _setProofStatus = (status: boolean) => {
    this.setState({ proofReady: status });
  };

  updateRHSState = (state: string) => {
    this.setState({ rhsStage: state });
  };

  _setSpaceUsed = (storageUsed: number, documentsUsed: number) => {
    this.setState({ storageUsed });
    this.setState({ documentsUsed });
  };

  _filesFoundMatching = (matchingFiles: any) => {
    matchingFiles.forEach((element) => {
      element.isDupe = true;
    });
    this.state.matchingFiles = _.uniqBy(matchingFiles, 'name');
    this.setState({ rhsStage: RHS_STAGES.DOCUMENT_MATCHING });
  };

  /**
   * Set tab to new upload and pass in the file list.
   * @param {Array<Object>} files - The list of files dropped into the view.
   */
  _onDropFile = (files: Array<Object>) => {
    const { newFileUpload } = this;
    this.setState({ lhsTabSelected: LHS_TABS.NEW_UPLOAD });
    newFileUpload.onDrop(files);
  };

  newFileUpload: any;

  viewDocs: any;

  render() {
    const {
      lhsTabSelected,
      rhsTabSelected,
      fileSelected,
      fileVersion,
      proofReady,
      shareDialogIsOpen,
      firstUploadDialogueOpen,
      firstProofDialogueOpen,
      matchingFiles,
      storageUsed,
      documentsUsed,
      userDetails,
      storageLimit,
      documentsLimit,
      size,
      isAuthenticated,
    } = this.state;
    const { history } = this.props;
    if (isAuthenticated === false) {
      return (
        <div className="App">
          <div className="AppBody">
            <div className="mainPanel">
              <Loading isFullScreen message="Loading, Please Wait..." />
            </div>
          </div>
        </div>
      );
    }

    const lhsTabs = [
      {
        id: 'viewDocs',
        icon: (
          <Tooltip content="View My Documents." position={Position.TOP}>
            <div className="tabIconWrapper">
              <ViewDocsIcon />
              <span className="tabIconText">Documents</span>
            </div>
          </Tooltip>
        ),
        panel: (
          <div className="wrapper">
            <ViewFiles
              ref={(c) => {
                this.viewDocs = c;
              }}
              onDropCallback={this._onDropFile}
              selectFileCallback={this._fileSelected}
              refreshFileSizeCallback={this._refreshFileSize}
            />
          </div>
        ),
      },
      {
        id: 'uploadDoc',
        icon: (
          <Tooltip content="Upload New Documents" position={Position.TOP}>
            <div className="tabIconWrapper">
              <PlusIcon />
              <span className="tabIconText">Upload</span>
            </div>
          </Tooltip>
        ),
        panel: (
          <div className="wrapper">
            <NewFileUpload
              history={history}
              storageUsed={storageUsed}
              documentsUsed={documentsUsed}
              storageLimit={storageLimit}
              documentsLimit={documentsLimit}
              ref={(c) => {
                this.newFileUpload = c;
              }}
              setStageCallback={this._setStage}
              swapTabCallback={this._swapLHSTab}
              updateSpaceUsedCallback={this._setSpaceUsed}
              updateRHSState={this.updateRHSState}
              updateMatchingFiles={(newMatchingFiles) => {
                this.setState({ matchingFiles: newMatchingFiles });
              }}
              matchingFiles={matchingFiles}
              filesFoundMatchingCallback={this._filesFoundMatching}
              setStorageLimitReachedCallback={this._setStorageLimitReached}
              setFailedFiles={(files, allUploadsInvalid) => {
                this.setState({ failedFiles: files });
                this.setState({ allUploadsInvalid });
              }}
            />
          </div>
        ),
      },
    ];

    const usedBytes = convertBytes(storageUsed, 'b', 3);
    const freeBytes = convertBytes(storageLimit - storageUsed, 'b', 3);
    const freeDocs = documentsLimit - documentsUsed;

    const lhsTabExtras = (
      <div className="fileSizeInfo">
        <span className="used">
          <b>Used: </b>
          {`${usedBytes.value} ${usedBytes.unit} (${documentsUsed} docs)`}
        </span>
        <div className="vr" />
        <span className="free">
          <b>Free: </b>
          {`${freeBytes.value} ${freeBytes.unit} (${freeDocs} docs)`}
        </span>
      </div>
    );

    const rhsTabs = [
      {
        id: 'viewDoc',

        icon: (
          <Tooltip content="View this document." position={Position.TOP}>
            <div className="tabIconWrapper">
              <PreviewDocumentIcon />
              <span className="tabIconText">Preview</span>
            </div>
          </Tooltip>
        ),
        panel: (
          <div className="wrapper">
            <ViewDocument
              history={history}
              file={fileSelected}
              fileVersion={fileVersion}
              tabSelect={rhsTabSelected}
              setStageCallback={this._setStage}
            />
          </div>
        ),
      },
      {
        id: 'viewProof',
        icon: (
          <Tooltip content="View the proof of this document." position={Position.TOP}>
            <div className="tabIconWrapper">
              <ViewProofIcon />
              <span className="tabIconText">Proof</span>
            </div>
          </Tooltip>
        ),
        panel: (
          <div className="wrapper">
            <ViewProof
              file={fileSelected}
              fileVersion={fileVersion}
              userDetails={userDetails}
              selectFileCallback={this._fileSelected}
              setProofCallback={this._setProofStatus}
            />
          </div>
        ),
      },
    ];

    if (fileSelected && fileSelected.proofInfo === PROOF_STATUS.VALID) {
      rhsTabs.push({
        id: 'viewCertificate',
        icon: (
          <Tooltip content="View the proof certificate for this document." position={Position.TOP}>
            <div className="tabIconWrapper">
              <CertificateIcon />
              <span className="tabIconText">Certificate</span>
            </div>
          </Tooltip>
        ),
        panel: (
          <div className="wrapper">
            <ProofCertificate file={fileSelected} fileVersion={fileVersion} />
          </div>
        ),
      });
    }

    const rhsTabExtras = (
      <div className="rhsExtras">
        {proofReady && fileSelected && (
          <Tooltip content="Download an archive for this proof." position={Position.TOP}>
            <DownloadAltIcon
              className="downloadAltIcon"
              onClick={() => {
                confirm({
                  title: (
                    <div>
                      <DownloadIcon className="downloadIcon" />
                      <span>Download Package</span>
                    </div>
                  ),
                  content: (
                    <span>
                      You are about to download an archive containing your document, its proof and
                      its metadata.
                      <br />
                      {' '}
You can use
                      {' '}
                      <a href={process.env.PROVENDOCS_ENV === ENVIRONMENT.PROD || !process.env.PROVENDOCS_ENV ? 'https://provendocs.com/downloads' : `https://${process.env.PROVENDOCS_ENV}.provendocs.com/downloads`} target="__blank">
                        ProvenDB-Verify
                      </a>
                      {' '}
                      to validate the proof of your document without ProvenDocs.
                      <br />
                      For information on validating your archive, see the
                      {' '}
                      <a href="https://provendb.readme.io/docs/provendb-verify" target="__blank">
                        documentation.
                      </a>
                    </span>
                  ),
                  okText: 'Download',
                  okType: 'success',
                  cancelText: 'Cancel',
                  cancelType: 'warning',
                  onOk: this._downloadArchiveRHS,
                  onCancel() {},
                });
              }}
            />
          </Tooltip>
        )}
        {proofReady && fileSelected && <div className="vr" />}
        {fileSelected && (
          <Tooltip content="Download a copy of this file." position={Position.TOP}>
            <DocumentIcon
              className="viewDocsIcon"
              onClick={() => {
                confirm({
                  title: (
                    <div>
                      <DownloadIcon className="downloadIcon" />
                      <span>Download File</span>
                    </div>
                  ),
                  content:
                    'Would you like to download a copy of the proven file?\n You may need to enable pop-ups.',
                  okText: 'Download',
                  okType: 'success',
                  cancelText: 'Cancel',
                  cancelType: 'warning',
                  onOk: this._downloadFileRHS,
                  onCancel() {},
                });
              }}
            />
          </Tooltip>
        )}
        {fileSelected && proofReady && <div className="vr" />}
        {fileSelected && proofReady && (
          <Tooltip content="Receive this proof via email." position={Position.TOP}>
            <EmailProofButton
              history={history}
              fileName={fileSelected.name}
              fileVersion={fileSelected._provendb_metadata.minVersion}
            />
          </Tooltip>
        )}
        {fileSelected && <div className="vr" />}
        {fileSelected && (
          <Tooltip content="Create a public link to this proof." position={Position.TOP}>
            <LinkIcon className="linkIcon" onClick={this._createLinkRHS} />
          </Tooltip>
        )}
      </div>
    );

    Log.info(
      'Dashboard is rendering, this should not happen much as it is very performance intensive.',
    );
    return (
      <div className="App">
        <TopNavBar
          userDetailsCallback={this._setUserDetails}
          isAuthenticatedCallback={this._setAuthenticated}
          currentPage={PAGES.DASHBOARD}
          isAuthenticated
          onEarlyAccess={null}
          history={history}
        />
        <div className="AppBody">
          <Modal
            className="firstUploadDialogueModal"
            cancelText="Ok"
            visible={firstUploadDialogueOpen}
            centered
            onCancel={() => {
              this.setState({ firstUploadDialogueOpen: false });
            }}
          >
            <ProofInProgress />
          </Modal>
          <Modal
            className="shareUploadDialogueModal"
            cancelText="Ok"
            visible={shareDialogIsOpen}
            centered
            onCancel={() => {
              this.setState({ shareDialogIsOpen: false });
            }}
          >
            <ShareDialog file={fileSelected} userDetails={userDetails} />
          </Modal>
          <Modal
            className="firstProofDialogueModal"
            cancelText="Ok"
            visible={firstProofDialogueOpen}
            centered
            onCancel={() => {
              this.setState({ firstProofDialogueOpen: false });
            }}
          >
            <ProofComplete />
          </Modal>
          <div className="mainPanel dashboard">
            <div className="pageTitle">
              <div className="left" />
              <div className="right" />
            </div>
            <div className="lowerGroup" id="lowerGroup">
              <SplitPane
                split="vertical"
                minSize={size.width <= 1280 ? 500 : size.width * 0.4} // Min size 40%
                maxSize={size.width <= 1280 ? 700 : size.width * 0.6} // Max size 60%
                defaultSize={size.width <= 1280 ? 645 : size.width * 0.5} // Default size 50%
              >
                <div className="lhs">
                  <TabbedPanel
                    className="lhsTabbedPanel"
                    tabs={lhsTabs}
                    extraComponents={lhsTabExtras}
                    tabSelected={lhsTabSelected}
                    setTabCallback={this._setTab}
                  />
                </div>
                <div className="rhs">
                  {lhsTabSelected === LHS_TABS.VIEW_DOCUMENTS && (
                    <TabbedPanel
                      className="lhsTabbedPanel"
                      tabs={rhsTabs}
                      extraComponents={rhsTabExtras}
                      tabSelected={rhsTabSelected}
                      setTabCallback={this._setRHSTab}
                    />
                  )}
                  {lhsTabSelected === LHS_TABS.NEW_UPLOAD && this._renderNewUploadRHS()}
                </div>
              </SplitPane>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Dashboard);
