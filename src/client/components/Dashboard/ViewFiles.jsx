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
 * @Last modified time: 2019-04-03T09:26:16+11:00
 */

/* eslint-disable class-methods-use-this */
import React from 'react';
import autobind from 'autobind-decorator';
import Timestamp from 'react-timestamp';
import {
  Position, Tooltip, Dialog, Tag, Intent,
} from '@blueprintjs/core';
import {
  Button, Dropdown, Menu, Icon, notification,
} from 'antd';
import Dropzone from 'react-dropzone';
import { fromEvent } from 'file-selector';
import _ from 'lodash';
import {
  PROOF_STATUS,
  FILE_SIZE_LIMIT,
  FILE_UPLOAD_LIMIT,
  ANTD_BUTTON_TYPES,
} from '../../common/constants';
import ViewFileThumb from './ViewFileThumb';
import FileHistoryButton from './FileHistoryButton';

import TileViewIcon from '../../style/icons/pages/dashboard/tile-view-icon.svg';
import ListViewIcon from '../../style/icons/pages/dashboard/list-view-icon.svg';
import TickIcon from '../../style/icons/pages/dashboard/tick-icon.svg';
import CrossIcon from '../../style/icons/pages/dashboard/cross-icon.svg';
import PendingIcon from '../../style/icons/pages/dashboard/uploading-icon.svg';
import CommentIcon from '../../style/icons/pages/dashboard/comment-icon.svg';
import ForgetIcon from '../../style/icons/pages/dashboard/close-icon.svg';
import BoyIcon from '../../style/icons/pages/dashboard/boy-folder-icon.svg';
import { api, Log } from '../../common';
import { Loading, Error } from '../Common';
// $FlowFixMe
import './ViewFiles.scss';

// Constants.
const ButtonGroup = Button.Group;
const VIEWS = {
  LIST_VIEW: 'listView',
  PREVIEW_VIEW: 'previewView',
  HISTORY_VIEW: 'historyView',
  ERROR: 'error',
};
const FILTERS = {
  SHOW_ALL: 'show_all',
  COMPLETE: 'complete',
  PENDING: 'pending',
};
const SORTS = {
  STATUS: 'status',
  FILENAME: 'filename',
  UPLOADED: 'uploaded',
};
const INTENTS = [Intent.NONE, Intent.PRIMARY, Intent.SUCCESS, Intent.DANGER, Intent.WARNING];
const openNotificationWithIcon = (type: string, title: string, message: string) => {
  notification[type]({
    message: title,
    description: message,
  });
};

// Types.
type Props = {
  selectFileCallback: any;
  onDropCallback: any;
  refreshFileSizeCallback: Function;
};
type State = {
  currentFilter: string;
  currentSort: Object;
  currentView: any;
  isLoading: boolean;
  fileList: any;
  fileSelected: any;
  fileHistory: Object;
  commentDialogIsOpen: boolean;
  commentSelected: any;
  forgetDialogIsOpen: boolean;
  forgetSelected: any;
  forgetFinished: boolean;
  forgetLoading: boolean;
};

export default class ViewFiles extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('ViewFiles');
    this.state = {
      currentFilter: FILTERS.SHOW_ALL,
      currentSort: { type: SORTS.UPLOADED, descending: true },
      currentView: VIEWS.PREVIEW_VIEW,
      isLoading: true,
      fileList: [],
      fileSelected: null,
      commentSelected: null,
      fileHistory: {},
      commentDialogIsOpen: false,
      forgetDialogIsOpen: false,
      forgetSelected: null,
      forgetFinished: false,
      forgetLoading: false,
    };
  }

  componentDidMount() {
    this.getFileList(true);
  }

  componentWillReceiveProps() {}

  @autobind
  getFileList(forceUpdate: boolean) {
    this.setState({ isLoading: true });
    const { fileList } = this.state;
    // Query Mongo and get a list of files for the user.
    api
      .getFileListForUser()
      .then((result) => {
        if (result.status === 200) {
          // Only refresh if forced, or if one or more items has been added to the list.
          if (forceUpdate || fileList.length !== result.data.length || result.data.length === 0) {
            this.setState({
              isLoading: false,
              fileList: result.data,
            });
            if (result.data.length > 0) {
              this._selectLatestFile();
            }
          } else {
            openNotificationWithIcon('error', 'Error', 'Failed to fetch file list, sorry!');
            Log.error(`Err getting file list: ${result}`);
            this.setState({ currentView: VIEWS.ERROR });
          }
        } else {
          openNotificationWithIcon('error', 'Error', 'Failed to get file preview, sorry!');
          Log.error(`Err getting file list: ${result.statusText}`);
          this.setState({ currentView: VIEWS.ERROR });
        }
      })
      .catch((err) => {
        Log.error(`Err: ${err}`);
        openNotificationWithIcon('error', 'Error', 'Failed to get file list, sorry!');
        this.setState({ currentView: VIEWS.ERROR });
      });
  }

  _selectLatestFile = () => {
    const { fileList } = this.state;
    const { selectFileCallback } = this.props;
    const latestFile = fileList[fileList.length - 1];
    selectFileCallback(latestFile);
    this.state.fileSelected = latestFile;
  };

  @autobind
  _renderFileList() {
    const {
      fileList, fileSelected, currentFilter, currentSort,
    } = this.state;
    const rows = [];

    let filterFunc;
    if (currentFilter === FILTERS.SHOW_ALL) {
      filterFunc = () => true;
    } else if (currentFilter === FILTERS.COMPLETE) {
      filterFunc = file => file.proofInfo && file.proofInfo === PROOF_STATUS.VALID;
    } else if (currentFilter === FILTERS.PENDING) {
      filterFunc = file => !file.proofInfo || file.proofInfo !== PROOF_STATUS.VALID;
    }

    let sortFunc;
    if (currentSort.type === SORTS.FILENAME) {
      // eslint-disable-next-line
      sortFunc = (fileA, fileB) => fileA.name.toLowerCase() > fileB.name.toLowerCase()
        ? 1
        : fileA.name.toLowerCase() < fileB.name.toLowerCase()
          ? -1
          : 0;
    } else if (currentSort.type === SORTS.STATUS) {
      // eslint-disable-next-line
      sortFunc = (fileA, fileB) => fileA.proofInfo > fileB.proofInfo ? -1 : fileA.proofInfo < fileB.proofInfo ? 1 : 0;
    } else if (currentSort.type === SORTS.UPLOADED) {
      // eslint-disable-next-line
      sortFunc = (fileA, fileB) => fileA.uploadedAt > fileB.uploadedAt ? -1 : fileA.uploadedAt < fileB.uploadedAt ? 1 : 0;
    }

    // Assume all files are below 16mb.
    fileList
      .filter(filterFunc)
      .sort(sortFunc)
      .forEach((file, key) => {
        const validClass = 'valid';
        let selectedClass = '';
        if (fileSelected && fileSelected.name === file.name) {
          selectedClass = 'selected';
        }
        // If any files is over 16mb, it is invalid and they cannot proceed.
        rows.push(
          <div
            className={`row ${selectedClass}`}
            // eslint-disable-next-line
            key={`row-${key}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              this._selectFileWithName(file.name);
            }}
          >
            {file.proofInfo && file.proofInfo === PROOF_STATUS.FAILED && (
              <CrossIcon className="crossIcon" />
            )}
            {file.proofInfo && file.proofInfo === PROOF_STATUS.VALID && (
              <TickIcon className="tickIcon" />
            )}
            {file.proofInfo
              && (file.proofInfo === PROOF_STATUS.PENDING
                || file.proofInfo === PROOF_STATUS.SUBMITTED) && (
                <PendingIcon className="pendingIcon" />
            )}
            <span className="fileName">
              <Tooltip content={file.name} position={Position.TOP}>
                {_.truncate(file.name, { length: 46 })}
              </Tooltip>
            </span>
            <span className={`fileSize ${validClass}`}>
              <Timestamp time={file.uploadedAt} format="full" />
            </span>
            <div className="fileButtons">
              <FileHistoryButton onClickCallback={this._onClickHistory} file={file} />
              <Tooltip content="See Document Comments.">
                <CommentIcon
                  className="commentIcon"
                  onClick={() => {
                    this._onClickComment(file);
                  }}
                />
              </Tooltip>
              <Tooltip content="Forget Document.">
                <ForgetIcon
                  className="forgetIcon"
                  onClick={() => {
                    this._onClickForget(file);
                  }}
                />
              </Tooltip>
            </div>
          </div>,
        );
      });
    return rows;
  }

  @autobind
  _renderFileHistory() {
    const { fileHistory, fileSelected } = this.state;
    const { docHistory } = fileHistory;
    const { history } = docHistory;
    const { versions } = history;

    const reverseStatusArray = versions.slice().reverse();
    const rows = [];
    versions
      .slice()
      .reverse()
      .forEach((file, key) => {
        let selectedClass = '';
        if (fileSelected === file) {
          selectedClass = 'selected';
        }
        rows.push(
          <div
            className={`row ${selectedClass}`}
            // eslint-disable-next-line
            key={`row-${key}`}
            onClick={() => {
              if (fileSelected !== file) {
                this.setState({ fileSelected: file });
                this._selectHistoryFile(file);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="status">
              {reverseStatusArray[key]
                && reverseStatusArray[key].status
                && reverseStatusArray[key].status === PROOF_STATUS.FAILED && (
                  <CrossIcon className="crossIcon" />
              )}
              {reverseStatusArray[key]
                && reverseStatusArray[key].status
                && reverseStatusArray[key].status === PROOF_STATUS.VALID && (
                  <TickIcon className="tickIcon" />
              )}
              {reverseStatusArray[key]
                && reverseStatusArray[key].status
                && (reverseStatusArray[key].status === PROOF_STATUS.PENDING
                  || reverseStatusArray[key].status === PROOF_STATUS.SUBMITTED
                  || reverseStatusArray[key].status === PROOF_STATUS.UNPROVEN) && (
                  <PendingIcon className="pendingIcon" />
              )}
            </div>
            <span className="number">{`${versions.length - key}: `}</span>
            <span className="fileName">{file.document.name}</span>
            <span className="fileDate">
              <Timestamp time={file.document.uploadedAt} format="full" />
            </span>
            <div className="commentButton">
              <CommentIcon
                className="commentIcon"
                onClick={() => this._onClickComment(file.document)}
              />
            </div>
          </div>,
        );
      });
    return rows;
  }

  @autobind
  _onClickHistory(file: Object) {
    this.setState({ isLoading: true });
    api
      .getFileHistoryForUser(file.name)
      .then((result) => {
        this.state.fileHistory = result.data;
        this.state.fileSelected = null;
        this.setState({ isLoading: false });
        this.setState({ currentView: VIEWS.HISTORY_VIEW });
      })
      .catch((err) => {
        Log.error(`Failed to fetch file history with err: ${err}`);
        openNotificationWithIcon('error', 'Error', 'Failed to get file history, sorry!');
        this.setState({ isLoading: false });
      });
  }

  @autobind
  _onClickComment(file: Object) {
    this.setState({ commentSelected: file });
    this.setState({ commentDialogIsOpen: true });
  }

  @autobind
  _onClickForget(file: Object) {
    this.setState({ forgetSelected: file });
    this.setState({ forgetDialogIsOpen: true });
  }

  @autobind
  _renderFilePreview() {
    const {
      fileList, fileSelected, currentFilter, currentSort,
    } = this.state;
    const cells = [];

    let filterFunc;
    if (currentFilter === FILTERS.SHOW_ALL) {
      filterFunc = () => true;
    } else if (currentFilter === FILTERS.COMPLETE) {
      filterFunc = file => file.proofInfo && file.proofInfo === PROOF_STATUS.VALID;
    } else if (currentFilter === FILTERS.PENDING) {
      filterFunc = file => !file.proofInfo || file.proofInfo !== PROOF_STATUS.VALID;
    }

    let sortFunc;
    if (currentSort.type === SORTS.FILENAME) {
      // eslint-disable-next-line
      sortFunc = (fileA, fileB) => fileA.name.toLowerCase() > fileB.name.toLowerCase()
        ? 1
        : fileA.name.toLowerCase() < fileB.name.toLowerCase()
          ? -1
          : 0;
    } else if (currentSort.type === SORTS.STATUS) {
      // eslint-disable-next-line
      sortFunc = (fileA, fileB) => fileA.proofInfo > fileB.proofInfo ? -1 : fileA.proofInfo < fileB.proofInfo ? 1 : 0;
    } else if (currentSort.type === SORTS.UPLOADED) {
      // eslint-disable-next-line
      sortFunc = (fileA, fileB) => fileA.uploadedAt > fileB.uploadedAt ? -1 : fileA.uploadedAt < fileB.uploadedAt ? 1 : 0;
    }

    // Assume all files are below 16mb.
    fileList
      .filter(filterFunc)
      .sort(sortFunc)
      .forEach((file, key) => {
        const validClass = 'valid';

        let selectedClass = '';
        if (fileSelected && fileSelected.name === file.name) {
          selectedClass = 'selected';
        }
        // If any files is over 16mb, it is invalid and they cannot proceed.
        cells.push(
          // eslint-disable-next-line
          <div className={`Grid-cell ${selectedClass}`} key={`cell-${key}`}>
            <div
              onClick={() => {
                // this._selectFileAtIndex(key);
                this._selectFileWithName(file.name);
              }}
              className={`filePreview ${validClass}`}
              role="button"
              tabIndex={0}
            >
              <ViewFileThumb file={file} selectedClass={selectedClass} />
            </div>
            <span className="fileName">
              <Tooltip content={file.name} position={Position.TOP}>
                {_.truncate(file.name, { length: 16 })}
              </Tooltip>
            </span>
            <span className="fileDate">
              <Timestamp time={file.uploadedAt} format="date" />
              <Timestamp time={file.uploadedAt} format="time" />
            </span>
            <div className="fileButtons">
              <FileHistoryButton onClickCallback={this._onClickHistory} file={file} />
              <Tooltip content="See Upload Comments.">
                <CommentIcon
                  className={`commentIcon enabled_${
                    file.comment.length > 0 || file.tags[0].length > 0 ? 'true' : 'false'
                  }`}
                  onClick={() => {
                    if (file.comment || file.tags) {
                      this._onClickComment(file);
                    }
                  }}
                />
              </Tooltip>
              <Tooltip content="Forget Document">
                <ForgetIcon
                  className="forgetIcon"
                  onClick={() => {
                    this._onClickForget(file);
                  }}
                />
              </Tooltip>
            </div>
          </div>,
        );
      });
    return <div className="Grid">{cells}</div>;
  }

  @autobind
  _selectFileWithName(fileName: string) {
    const { selectFileCallback } = this.props;
    const { fileList, fileSelected } = this.state;
    let newFileSelected;
    fileList.forEach((file) => {
      if (fileName === file.name) {
        newFileSelected = file;
      }
    });
    if (newFileSelected) {
      if (newFileSelected !== fileSelected) {
        selectFileCallback(newFileSelected);
        // this.setState({ fileSelected: index });
        this.state.fileSelected = newFileSelected;
      }
    }
  }

  @autobind
  _selectHistoryFile(file: Object) {
    const { selectFileCallback } = this.props;
    file.document._provendb_metadata = {};
    file.document._provendb_metadata.minVersion = file.minVersion;
    this.setState({ fileSelected: file });
    selectFileCallback(file.document, file.minVersion);
  }

  @autobind
  _onDrop(files: Array<Object>) {
    const { onDropCallback } = this.props;
    onDropCallback(files);
  }

  @autobind
  _setFilterStatus(newFilter: string) {
    const { currentFilter } = this.state;
    if (newFilter !== currentFilter) {
      this.setState({ currentFilter: newFilter });
    }
  }

  @autobind
  _handleSortMenuClick(e: any) {
    const { currentSort } = this.state;
    const { type, descending } = currentSort;

    // Flip ascending / descending.
    if (type === e.key) {
      const newDescending = !descending;
      this.setState({ currentSort: { type: e.key, descending: newDescending } });
    } else {
      this.setState({ currentSort: { type: e.key, descending: true } });
    }
  }

  @autobind
  _forgetFile(file: Object) {
    const { refreshFileSizeCallback } = this.props;
    this.setState({ forgetLoading: true });
    api
      .forgetFile(file)
      .then(() => {
        openNotificationWithIcon('success', 'File Forgotten', 'Your file has been forgotten.');
        refreshFileSizeCallback();
        this.setState({ forgetLoading: false });
        this.setState({ forgetDialogIsOpen: false });
        this.setState({ forgetFinished: true });
        this.getFileList(true);
      })
      .catch((err) => {
        openNotificationWithIcon('error', 'Error', 'We failed to forget your file, sorry!');
        Log.error(`Error forgetting file: ${err}`);
      });
  }

  @autobind
  _downloadFile(file: Object) {
    if (!file) {
      openNotificationWithIcon(
        'warning',
        'No File Selected.',
        'Please select a file and try again.',
      );
    } else if (file.proofInfo === PROOF_STATUS.VALID) {
      if (file._provendb_metadata) {
        api.downloadProofArchiveForFile(file.name, file._provendb_metadata.minVersion);
      } else {
        Log.error('Err downloading file: No version information for file');
        openNotificationWithIcon('error', 'Error', 'Cannot download archive for this file, sorry!');
      }
    } else if (file._provendb_metadata) {
      api.downloadHistoricalFile(file.name, file._provendb_metadata.minVersion);
    } else {
      api.downloadFile(file);
    }
  }

  @autobind
  renderForgetDialogBody() {
    const { forgetSelected, forgetFinished, forgetLoading } = this.state;
    if (!forgetSelected) {
      return (
        <div className="forgetMessage">
          <span> No file selected! </span>
          <span>
            <b />
          </span>
        </div>
      );
    }
    if (forgetLoading) {
      return (
        <Loading
          color="#1e557b"
          isFullScreen={false}
          message="Please wait, forgetting your document..."
        />
      );
    }
    if (forgetFinished) {
      return (
        <div className="forgetMessage">
          <span> Document has been forgotten. </span>
          <span className="forgetFile">
            <b>
              {forgetSelected.name}
              {' '}
            </b>
          </span>
        </div>
      );
    }
    return (
      <div className="forgetMessage">
        <span> Are you sure you want to forget this document? </span>
        <span className="forgetFile">
          <b>
            {forgetSelected.name}
            {' '}
          </b>
        </span>
        <Button className="downloadButton" onClick={() => this._downloadFile(forgetSelected)}>
          {`${
            forgetSelected.proofInfo === PROOF_STATUS.VALID ? 'Download Archive' : 'Download Copy'
          }`}
        </Button>
        <span className="forgetExplain">
          <b>Please Note: </b>
          <span>
            Forgetting this document will not invalidate or delete your Blockchain proofs. However
            the document will not be stored on our servers anymore.
            <br />
            We recommend downloading an archive of this file and its proof.
          </span>
          <b>The Forgetting process is permanent.</b>
        </span>
      </div>
    );
  }

  render() {
    const {
      isLoading,
      currentView,
      fileHistory,
      commentDialogIsOpen,
      commentSelected,
      forgetDialogIsOpen,
      forgetSelected,
      forgetFinished,
      forgetLoading,
      fileList,
      currentSort,
      currentFilter,
    } = this.state;
    const tagElements = [];
    if (commentSelected && commentSelected.tags) {
      commentSelected.tags.forEach((tag, index) => tagElements.push(<Tag intent={INTENTS[index % INTENTS.length]}>{tag}</Tag>));
    } else {
      tagElements.push(
        <span className="noTags">
          <i>No tags for this document.</i>
        </span>,
      );
    }

    const commentDialog = (
      <Dialog
        className="commentDialog smallDialog"
        isOpen={commentDialogIsOpen}
        onClose={() => {
          this.setState({ commentDialogIsOpen: false });
        }}
      >
        <div className="commentDialogWrapper">
          <span className="commentTitle">Comment:</span>
          <span className="comment">
            {(commentSelected && commentSelected.comment) || <i>No comments for this document.</i>}
          </span>
          <span className="tagsTitle">Tags:</span>
          <div className="tagsList">{tagElements}</div>
          <Button
            text="Close"
            className="closeButton blueButton"
            type={ANTD_BUTTON_TYPES.PRIMARY}
            onClick={() => {
              this.setState({ commentDialogIsOpen: false });
            }}
          >
            Close
          </Button>
        </div>
      </Dialog>
    );

    const forgetDialog = (
      <Dialog
        className="forgetDialog smallDialog"
        isOpen={forgetDialogIsOpen}
        onClose={() => {
          this.setState({ forgetDialogIsOpen: false });
          this.setState({ forgetFinished: false });
          this.setState({ forgetSelected: null });
          this.setState({ forgetLoading: false });
        }}
      >
        <div className="forgetDialogWrapper">
          <div className="dialogHeader">
            <span className="forgetTitle">Forget Document</span>
          </div>
          <div className="dialogBody">
            <span className="forgetInfo">{this.renderForgetDialogBody()}</span>
          </div>
          <div className="dialogFooter">
            <Button
              disabled={forgetLoading}
              className={`closeButton disabled_${forgetLoading.toString()}`}
              onClick={() => {
                this.setState({ forgetDialogIsOpen: false });
                this.setState({ forgetFinished: false });
                this.setState({ forgetSelected: null });
                this.setState({ forgetLoading: false });
              }}
            >
              Cancel
            </Button>
            {!forgetFinished && (
              <Button
                disabled={forgetLoading}
                className={`forgetButton disabled_${forgetLoading.toString()}`}
                type="danger"
                onClick={() => this._forgetFile(forgetSelected)}
              >
                Forget
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    );

    if (isLoading) {
      return (
        <div className="viewFiles subWrapper">
          <div className="contentWrapper">
            <Loading isFullScreen={false} message="Fetching your files..." />
          </div>
        </div>
      );
    }

    if (currentView === VIEWS.ERROR) {
      return (
        <div className="viewFiles subWrapper">
          <div className="contentWrapper">
            <div className="fileSummaryListWrapper">
              <div className="fileList">
                <div className="row header">
                  <Error message="Failed to get file list for you." isFullScreen={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === VIEWS.HISTORY_VIEW) {
      return (
        <div className="viewFiles subWrapper">
          <div className="contentWrapper">
            <div className="fileSummaryListWrapper">
              <div className="fileList">
                <div className="row header">
                  <span className="headerLabel">Versions</span>
                </div>
                {fileHistory && this._renderFileHistory()}
              </div>
            </div>
            <div className="backButton">
              <Button
                className="backButton"
                type={ANTD_BUTTON_TYPES.PRIMARY}
                onClick={() => {
                  this.state.fileSelected = null;
                  this.setState({ currentView: VIEWS.PREVIEW_VIEW });
                }}
              >
                {'Back'}
              </Button>
            </div>
          </div>
          {commentDialog}
          {forgetDialog}
        </div>
      );
    }

    // First upload.
    if (fileList.length === 0) {
      return (
        <div className=" viewFiles subWrapper">
          <div className="contentWrapper">
            <Dropzone
              disableClick
              className="dropZone"
              activeClassName="activeDropZone"
              disabledClassName="disabledDropZone"
              acceptClassName="acceptDropZone"
              rejectClassName="rejectDropZone"
              onDrop={this._onDrop}
              getDataTransferItems={evt => fromEvent(evt)}
              maxSize={FILE_SIZE_LIMIT}
              maxFiles={FILE_UPLOAD_LIMIT}
            >
              <div className="fileSummaryListWrapper empty">
                <div className="messageWrapper">
                  <BoyIcon className="boyFolderIcon" />
                  <span className="messageHeader">Upload your first file or folder!</span>
                  <span className="message">
                    {`You may upload up to ${FILE_UPLOAD_LIMIT.toString()} files at a time by swapping to the new upload tab at the top of
                    this section, dragging a file into this section or emailing a document to`}
                    {' '}
                    <a href="mailto:uploads@upload.provendocs.com">Uploads@Upload.ProvenDocs.com</a>
                    {' '}
                  </span>
                </div>
              </div>
            </Dropzone>
          </div>
        </div>
      );
    }
    const sortMenu = (
      <Menu trigger={['click']} onClick={this._handleSortMenuClick}>
        <Menu.Item
          className={`sort_selected_${(currentSort.type === SORTS.STATUS).toString()}`}
          key="status"
        >
          Proof Status
        </Menu.Item>
        <Menu.Item
          className={`sort_selected_${(currentSort.type === SORTS.FILENAME).toString()}`}
          key="filename"
        >
          File Name
        </Menu.Item>
        <Menu.Item
          className={`sort_selected_${(currentSort.type === SORTS.UPLOADED).toString()}`}
          key="uploaded"
        >
          Upload Date
        </Menu.Item>
      </Menu>
    );

    return (
      <div className="viewFiles subWrapper">
        <div className="contentWrapper">
          <Dropzone
            disableClick
            className="dropZone"
            activeClassName="activeDropZone"
            disabledClassName="disabledDropZone"
            acceptClassName="acceptDropZone"
            rejectClassName="rejectDropZone"
            onDrop={this._onDrop}
            getDataTransferItems={evt => fromEvent(evt)}
            maxSize={FILE_SIZE_LIMIT}
            maxFiles={FILE_UPLOAD_LIMIT}
          >
            <div className="fileSummaryListWrapper">
              <div className="fileList">
                <span className="headerLabel">Your Documents</span>
                <div className="row header">
                  <div className="headerFilters">
                    <ButtonGroup className="filterButtonGroup">
                      <Button
                        className={`showAllButton selected_${(
                          currentFilter === FILTERS.SHOW_ALL
                        ).toString()}`}
                        onClick={() => this._setFilterStatus(FILTERS.SHOW_ALL)}
                      >
                        Show All
                      </Button>
                      <Button
                        className={`completeButton selected_${(
                          currentFilter === FILTERS.COMPLETE
                        ).toString()}`}
                        onClick={() => this._setFilterStatus(FILTERS.COMPLETE)}
                      >
                        Complete
                      </Button>
                      <Button
                        className={`pendingButton selected_${(
                          currentFilter === FILTERS.PENDING
                        ).toString()}`}
                        onClick={() => this._setFilterStatus(FILTERS.PENDING)}
                      >
                        Pending
                      </Button>
                    </ButtonGroup>
                    <Dropdown overlay={sortMenu}>
                      <Button className="sortButton" style={{}}>
                        Sort
                        {' '}
                        <Icon type="down" />
                      </Button>
                    </Dropdown>
                  </div>
                  <div className="headerButtons">
                    <Button
                      className={`iconButton tileViewIcon ${(
                        currentView === VIEWS.PREVIEW_VIEW
                      ).toString()}`}
                      type={ANTD_BUTTON_TYPES.PRIMARY}
                      onClick={() => {
                        this.setState({ currentView: VIEWS.PREVIEW_VIEW });
                      }}
                    >
                      <TileViewIcon />
                    </Button>
                    <Button
                      className={`iconButton listViewIcon ${(
                        currentView === VIEWS.LIST_VIEW
                      ).toString()}`}
                      type={ANTD_BUTTON_TYPES.PRIMARY}
                      onClick={() => {
                        this.setState({ currentView: VIEWS.LIST_VIEW });
                      }}
                    >
                      <ListViewIcon />
                    </Button>
                  </div>
                </div>
                <div className="files">
                  {currentView === VIEWS.LIST_VIEW && this._renderFileList()}
                  {currentView === VIEWS.PREVIEW_VIEW && this._renderFilePreview()}
                </div>
              </div>
            </div>
          </Dropzone>
        </div>
        {commentDialog}
        {forgetDialog}
      </div>
    );
  }
}
