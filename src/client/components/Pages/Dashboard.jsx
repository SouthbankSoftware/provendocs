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
 * @Date:   2019-04-01T16:06:05+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-03T09:25:50+11:00
 */


import React from 'react';
import { withRouter } from 'react-router';
import autobind from 'autobind-decorator';
import { Switch, Tooltip, Position } from '@blueprintjs/core';
import _ from 'lodash';
import SplitPane from 'react-split-pane';
import { Button, Modal } from 'antd';
import Cookies from 'universal-cookie';
import {
  ShareDialog, CommentAndTags, TopNavBar, ProofInProgress, ProofComplete,
} from '../index';
import { convertBytes, openNotificationWithIcon } from '../../common/util';
import { api } from '../../common';
import Log from '../../common/log';
import {
  TabbedPanel, EmailProofButton, NewFileUpload, ViewFiles,
} from '../Dashboard/index';
import { PAGES, ANTD_BUTTON_TYPES, PROOF_STATUS } from '../../common/constants';
import { checkAuthentication } from '../../common/authentication';
import { Loading } from '../Common';
import ViewDocsIcon from '../../style/icons/pages/dashboard/view-documents-icon.svg';
import UploadIcon from '../../style/icons/pages/dashboard/upload-icon.svg';
import PlusIcon from '../../style/icons/pages/dashboard/plus-icon.svg';
import ArrowIcon from '../../style/icons/pages/upload-file-folder-pages/arrow.svg';
import HistoryIcon from '../../style/icons/pages/dashboard/merkle-tree-icon.svg';
import EmailIcon from '../../style/icons/pages/dashboard/email-icon.svg';
import LinkIcon from '../../style/icons/pages/dashboard/link-icon.svg';
import ViewProofIcon from '../../style/icons/pages/dashboard/view-proof-icon.svg';
import PreviewDocumentIcon from '../../style/icons/pages/dashboard/preview-document-icon.svg';
import DownloadAltIcon from '../../style/icons/pages/dashboard/download-icon-alt.svg';
import DownloadIcon from '../../style/icons/pages/dashboard/download-icon.svg';
import ViewDocument from '../ViewDocument/ViewDocument';
import ViewProof from '../ViewProof/ViewProof';
import ProofDialog from '../ProofDiagram/ProofDialog';

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
  isAuthenticated: boolean;
  storageUsed: number;
  documentsUsed: number;
  storageLimit: number;
  documentsLimit: number;
  comment: string;
  allUploadsInvalid: boolean;
  commentTags: Array<string>;
  lhsTabSelected: string;
  rhsTabSelected: string;
  fileSelected: Object | null;
  fileVersion: number;
  rhsStage: string;
  proofReady: boolean;
  diagramDialogIsOpen: boolean;
  firstUploadDialogueOpen: boolean;
  firstProofDialogueOpen: boolean;
  storageLimitReached: boolean;
  shareDialogIsOpen: boolean;
  matchingFiles: Array<Object>;
  failedFiles: Array<string>;
  size: Object;
  checkAll: boolean;
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
      comment: '',
      allUploadsInvalid: false,
      commentTags: [],
      lhsTabSelected: LHS_TABS.VIEW_DOCUMENTS,
      rhsTabSelected: RHS_TABS.VIEW_DOCUMENT,
      fileSelected: null,
      fileVersion: 0, // 0 means current.
      rhsStage: RHS_STAGES.BEGIN,
      proofReady: false,
      diagramDialogIsOpen: false,
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
                this.setState({ storageUsed: res.data[0].storageUsed });
                this.setState({ documentsUsed: res.data[0].documentsUsed });
                this.setState({ storageLimit: res.data[0].storageLimit });
                this.setState({ documentsLimit: res.data[0].documentsLimit });
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
        openNotificationWithIcon(
          'error',
          'File List Error',
          'Failed to get files size, sorry.',
        );
      });
  }

  _checkAndShowFirstUploadDialogue = () => {
    if ((cookies.get('provendocs_upload_dont_remind_me') === 'false' || cookies.get('provendocs_upload_dont_remind_me') === undefined)) {
      this.setState({ firstUploadDialogueOpen: true });
    }
  }

  @autobind
  _checkAuth() {
    return new Promise((resolve, reject) => {
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
  }

  @autobind
  _updateDimensions() {
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
  }

  @autobind
  _swapLHSTab(uploadComplete: boolean) {
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
  }

  @autobind
  _swapRHSTab() {
    const { rhsTabSelected } = this.state;
    if (rhsTabSelected === RHS_TABS.VIEW_PROOF) {
      this.setState({ rhsTabSelected: RHS_TABS.VIEW_DOCUMENT });
    } else {
      this.setState({ rhsTabSelected: RHS_TABS.VIEW_PROOF });
    }
  }

  @autobind
  _fileSelected(file: Object, fileVersion: number) {
    this.state.fileVersion = fileVersion;
    this.setState({ fileSelected: file });
    if (file.proofInfo === PROOF_STATUS.VALID && (cookies.get('provendocs_proof_dont_remind_me') === 'false' || cookies.get('provendocs_proof_dont_remind_me') === undefined)) {
      this.setState({ firstProofDialogueOpen: true });
    }
  }

  @autobind
  _setTab(newTabId: string) {
    this.setState({ lhsTabSelected: newTabId });
  }

  @autobind
  _setRHSTab(newTabId: string) {
    this.setState({ rhsTabSelected: newTabId });
  }

  @autobind
  _setStage(newStage: string) {
    this.setState({ rhsStage: newStage });
  }

  @autobind
  _onClickContinue(comment?: string, commentTags?: Array<any>) {
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
  }

  @autobind
  _onClickCancel() {
    const { newFileUpload } = this;
    this.state.comment = '';
    this.state.commentTags = [];
    newFileUpload.onClickCancel();
  }

  _renderNewUploadRHS() {
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
              Would you like to update the existing document OR create a new document?
            </span>

            <div className="duplicateList">
              <div className="checkAll">
                <div className={`duplicateSwitch checked_${checkAll.toString()}`}>
                  <span className="noLabel">New Document </span>
                  <Switch
                    label="Update"
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
              </div>
              {matchingFiles.map(item => (
                <div className={`duplicateItem checked_${item.isDupe}`}>
                  <div className="duplicateName">{item.name}</div>
                  <div className="duplicateSwitch">
                    <span className="noLabel">New Document </span>
                    <Switch
                      label="Update"
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
  }

  @autobind
  _downloadArchiveRHS() {
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
  }

  @autobind
  _downloadFileRHS() {
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
  }

  @autobind
  _historyRHS() {
    const { history } = this.props;
    this._checkAuth()
      .then(() => {
        this.setState({ diagramDialogIsOpen: true });
      })
      .catch(() => {
        history.push('/login/expired');
      });
  }

  @autobind
  _onDiagramDialogIsClosed() {
    this.setState({ diagramDialogIsOpen: false });
  }

  @autobind
  _onShareDialogIsClosed() {
    this.setState({ shareDialogIsOpen: false });
  }

  @autobind
  _createLinkRHS() {
    const { history } = this.props;
    this._checkAuth()
      .then(() => {
        this.setState({ shareDialogIsOpen: true });
      })
      .catch(() => {
        history.push('/login/expired');
      });
  }

  @autobind
  _showConfirmUploadDialog(comment?: string, commentTags?: Array<any>) {
    const { newFileUpload } = this;
    confirm({
      title: (
        <div>
          <UploadIcon className="uploadIcon" />
          <span>Upload Documents.</span>
        </div>
      ),
      content: "Are you sure you'd like to continue to upload?\n You cannot reverse this option.",
      okText: 'Upload',
      okType: 'success',
      cancelText: 'Cancel',
      cancelType: 'warning',
      onOk() {
        newFileUpload.duplicateUpload(comment, commentTags);
      },
      onCancel() {},
    });
  }

  @autobind
  _setProofStatus(status: boolean) {
    this.setState({ proofReady: status });
  }

  @autobind
  updateRHSState(state: string) {
    this.setState({ rhsStage: state });
  }

  @autobind
  _setSpaceUsed(storageUsed: number, documentsUsed: number) {
    this.setState({ storageUsed });
    this.setState({ documentsUsed });
  }

  @autobind
  _filesFoundMatching(matchingFiles: any) {
    matchingFiles.forEach((element) => {
      element.isDupe = true;
    });
    this.state.matchingFiles = _.uniqBy(matchingFiles, 'name');
    this.setState({ rhsStage: RHS_STAGES.DOCUMENT_MATCHING });
  }

  @autobind
  /**
   * Set tab to new upload and pass in the file list.
   * @param {Array<Object>} files - The list of files dropped into the view.
   */
  _onDropFile(files: Array<Object>) {
    const { newFileUpload } = this;
    this.setState({ lhsTabSelected: LHS_TABS.NEW_UPLOAD });
    newFileUpload.onDrop(files);
  }


  newFileUpload: any;

  viewDocs: any;


  render() {
    const {
      lhsTabSelected,
      rhsTabSelected,
      fileSelected,
      fileVersion,
      proofReady,
      diagramDialogIsOpen,
      shareDialogIsOpen,
      firstUploadDialogueOpen,
      firstProofDialogueOpen,
      matchingFiles,
      storageUsed,
      documentsUsed,
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
              swapTabCallback={this._swapLHSTab}
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
    // $FlowFixMe
    const lhsTabExtras = (
      <div className="fileSizeInfo">
        <span className="used">
          <b>Used: </b>
          {`${usedBytes.value} ${usedBytes.unit} (${documentsUsed}) docs`}
        </span>
        <div className="vr" />
        <span className="free">
          <b>Free: </b>
          {`${freeBytes.value} ${freeBytes.unit} (${freeDocs}) docs`}
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
              swapTabCallback={this._swapRHSTab}
              selectFileCallback={this._fileSelected}
              setProofCallback={this._setProofStatus}
            />
          </div>
        ),
      },
    ];
    const rhsTabExtras = <div className="rhsExtras" />;

    Log.info(
      'Dashboard is rendering, this should not happen much as it is very performance intensive.',
    );
    return (
      <div className="App">
        <TopNavBar currentPage={PAGES.DASHBOARD} isAuthenticated onEarlyAccess={null} />
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
              <div className="left">
                <ViewDocsIcon />
                <span className="title"> Dashboard </span>
              </div>
              <div className="right">
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
                          content:
                            'Would you like to download your fully\npackaged blockchain proof?\nYou may need to enable pop-ups.',
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
                    <ViewDocsIcon
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
                {fileSelected && <div className="vr" />}
                {fileSelected && (
                  <Tooltip
                    content="See the proof process for this document."
                    position={Position.TOP}
                  >
                    <HistoryIcon className="historyIcon" onClick={this._historyRHS} />
                  </Tooltip>
                )}
                {fileSelected && proofReady && <div className="vr" />}
                {fileSelected && proofReady && (
                  <Tooltip content="Recieve this proof via email." position={Position.TOP}>
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
            </div>
            {fileSelected && diagramDialogIsOpen && (
              <ProofDialog
                history={history}
                isOpen={diagramDialogIsOpen}
                file={fileSelected}
                fileVersion={fileVersion}
                onClose={this._onDiagramDialogIsClosed}
              />
            )}
            {fileSelected && shareDialogIsOpen && (
              <ShareDialog
                history={history}
                isOpen={shareDialogIsOpen}
                file={fileSelected}
                fileVersion={fileVersion}
                onClose={this._onShareDialogIsClosed}
              />
            )}
            <div className="lowerGroup" id="lowerGroup">
              <SplitPane
                split="vertical"
                minSize={size.width / 4 < 500 ? 500 : size.width / 4}
                maxSize={(size.width / 4) * 3 < 900 ? 900 : (size.width / 4) * 3}
                defaultSize={size.width / 2 < 500 ? 500 : size.width / 2}
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
