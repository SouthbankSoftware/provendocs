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
  PAGES,
  ANTD_BUTTON_TYPES,
  GA_CATEGORIES,
  PROOF_STATUS,
  ENVIRONMENT,
  DOMAINS,
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
import UserSadIcon from '../../style/icons/pages/status-pages/user-sad-404-icon.svg';
import ViewDocument from '../ViewDocument/ViewDocument';
import ViewProof from '../ViewProof/ViewProof';

// $FlowFixMe
import './Dashboard.scss';

const cookies = new Cookies();
const { confirm, info } = Modal;

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
  isMobile: boolean,
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
      isMobile: false,
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
          if (this.detectMobile()) {
            info({
              title: (
                <div>
                  <UserSadIcon className="uploadIcon large" />
                  <span>Mobile Features</span>
                </div>
              ),
              content:
                'Currently not all features are supported on a mobile browser. For the full ProvenDocs experience please revisit this page on a desktop!',
              okText: 'Ok',
              okType: 'success',
              onOk() {
                let count = 0;
                const newInterval = setInterval(() => {
                  if (count > 20) {
                    clearInterval(newInterval);
                  }
                  const elem = document.querySelector('body > div.grsf-global');
                  if (elem) {
                    elem.setAttribute('style', 'display: none');
                    clearInterval(newInterval);
                  }
                  count += 1;
                }, 3000);

                ReactGA.event({
                  category: GA_CATEGORIES.DASHBOARD,
                  action: 'Continue In Mobile View',
                  label: 'Button',
                });
              },
            });
            this.setState({ isMobile: true });
          }
          setTimeout(() => {
            this.setState({ isAuthenticated: true });
            api
              .getFileSizeForUser()
              .then((res) => {
                console.info(`Get files size result: ${res.status}`);
                if (res.status === 200) {
                  if (res.data.filesSize[0]) {
                    // GROWSURF`
                    let count = 0;
                    const checkGrowsurfInterval = setInterval(() => {
                      console.log('Checking Growsurf is initialized: ', count, ' / 20');
                      if (window && window.growsurf && window.growsurf.getParticipantById) {
                        console.log('Growsurf avaliable.');
                        window.growsurf
                          .addParticipant(res.data.email)
                          .then(() => {
                            console.log('Added participant to Growsurf.');
                          })
                          .catch((growSurfErr) => {
                            console.error(
                              `Error adding participant: ${JSON.stringify(growSurfErr)}`,
                            );
                          });
                        clearInterval(checkGrowsurfInterval);
                      } else {
                        if (count === 5) {
                          console.error(
                            'Failed to validate referrel participant in 5000ms, triggering load window event....',
                          );
                          const evt = document.createEvent('Event');
                          evt.initEvent('load', false, false);
                          window.dispatchEvent(evt);
                        } else if (count === 10) {
                          console.error(
                            'Failed to validate referrel participant in 10000ms, triggering load window event....',
                          );
                          const evt = document.createEvent('Event');
                          evt.initEvent('load', false, false);
                          window.dispatchEvent(evt);
                        } else if (count === 15) {
                          console.error(
                            'Failed to validate referrel participant in 15000ms, triggering load window event....',
                          );
                          const evt = document.createEvent('Event');
                          evt.initEvent('load', false, false);
                          window.dispatchEvent(evt);
                        } else if (count > 20) {
                          console.error(
                            'Failed to validate referrel participant in 20000ms, Giving up :(',
                          );
                          clearInterval(checkGrowsurfInterval);
                        }
                        count += 1;
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
                            console.info(`Added participant to Growsurf: ${participant}.`);
                          })
                          .catch((growSurfErr) => {
                            console.error(
                              `Error adding participant: ${JSON.stringify(growSurfErr)}`,
                            );
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
                console.error(`Error fetching files size: ${err}`);
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
        } else {
          console.log(`Result of checkAuth: ${JSON.stringify(response)}`);
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
        Log.info('Get files size result: ');
        Log.info(res);
        if (res.status === 200) {
          if (res.data.filesSize[0]) {
            let count = 0;
            const checkGrowsurfInterval = setInterval(() => {
              console.log('Checking Growsurf is initialized: ', count, ' / 10');
              if (count > 10) {
                console.error(
                  'Failed to validate referrel participant in 20000ms, please contact support.',
                );
                clearInterval(checkGrowsurfInterval);
              }
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
              } else {
                count += 1;
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
                    console.log(`Added participant to Growsurf: ${participant}.`);
                  })
                  .catch((growSurfErr) => {
                    console.error(`Error adding participant: ${JSON.stringify(growSurfErr)}`);
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
            window.location.assign(`/api/util/getArchive/${fileSelected.name}/${fileVersion}`);
            // window.open(`/api/util/getArchive/${fileSelected.name}/${fileVersion}`);
          } else {
            window.location.assign(`/api/util/getArchive/${fileSelected.name}/${fileVersion}`);
            // window.open(`/api/util/getArchive/${fileSelected.name}/${fileVersion}`);
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
    const { isMobile } = this.state;
    console.log(state);
    if (isMobile) {
      const elem = document.querySelector('#lowerGroup > div > div');
      if (elem) {
        // $FlowFixMe
        document.querySelector('#lowerGroup > div > div').scrollLeft = Number.MAX_SAFE_INTEGER;
      }
    }
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

  newFileUpload: any;

  viewDocs: any;

  render() {
    const {
      lhsTabSelected,
      isMobile,
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
              onClickUploadCallback={this._swapLHSTab}
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
                      You can use
                      <a
                        href={
                          DOMAINS.PROVENDOCS_ENV === ENVIRONMENT.PROD || !DOMAINS.PROVENDOCS_ENV
                            ? 'https://provendocs.com/downloads'
                            : `https://${DOMAINS.PROVENDOCS_ENV}.provendocs.com/downloads`
                        }
                        target="__blank"
                      >
                        ProvenDB-Verify
                      </a>
                      to validate the proof of your document without ProvenDocs.
                      <br />
                      For information on validating your archive, see the
                      <a
                        href="https://provendocs.readme.io/docs/validating-an-exported-document"
                        target="__blank"
                      >
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
          {!isMobile && (
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
          )}
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
          {!isMobile && (
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
          )}
          <div className={`mainPanel dashboard isMobile_${isMobile.toString()}`}>
            <div className="pageTitle">
              <div className="left" />
              <div className="right" />
            </div>
            <div className={`lowerGroup isMobile_${isMobile.toString()}`} id="lowerGroup">
              {!isMobile && (
                <SplitPane
                  split="vertical"
                  minSize={size.width <= 1280 ? 500 : size.width * 0.4} // Min size 40%
                  maxSize={size.width <= 1280 ? 700 : size.width * 0.6} // Max size 60%
                  defaultSize={size.width <= 1280 ? 645 : size.width * 0.5}
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
              )}
              {isMobile && (
                <div className="mobile lhs">
                  <div className="panels lowergroup">
                    <div className="panelLeft">
                      <span className="message">{'Scroll right for Proof >'}</span>
                      <TabbedPanel
                        className="lhsTabbedPanel"
                        tabs={lhsTabs}
                        extraComponents={lhsTabExtras}
                        tabSelected={lhsTabSelected}
                        setTabCallback={this._setTab}
                      />
                    </div>
                    <div className="panelRight rhs">
                      <span className="message">{'< Scroll left for Docs'}</span>
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Dashboard);
