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
import autobind from 'autobind-decorator';
import Dropzone from 'react-dropzone';
import { fromEvent } from 'file-selector';
import _ from 'lodash';
import { Button } from 'antd';
import FileIcon from '../../style/icons/pages/upload-file-folder-pages/folder-icon.svg';
import ForgetIcon from '../../style/icons/pages/dashboard/close-icon.svg';
import { convertBytes, openNotificationWithIcon } from '../../common/util';
import { Log, api } from '../../common';
import { Loading, Error } from '../Common';
import { FILE_SIZE_LIMIT, FILE_UPLOAD_LIMIT } from '../../common/constants';
// $FlowFixMe
import './NewUpload.scss';

const STAGES = {
  BEGIN: 'begin',
  FILES_EXCEEDING: 'files_exceeding',
  DOCUMENT_MATCHING: 'document_matching',
  LOADING: 'loading',
  LOADING_ONE: 'loading_one',
  LOADING_TWO: 'loading_two',
  FILE_SUMMARY: 'fileSummary',
  COMMENT: 'comment',
  CONFLICT_RESOLUTION: 'conflictResolution',
  ERROR: 'error',
};

export const RHS_STAGES = {
  BEGIN: 'begin',
  FILES_EXCEEDING: 'files_exceeding',
  DOCUMENT_MATCHING: 'document_matching',
  LOADING: 'loading',
  SELECT_FILE: 'selectFile',
  FILE_PREVIEW: 'filePreview',
  COMMENT: 'comment',
  ERROR: 'error',
};

type Props = {
  setStageCallback: any;
  swapTabCallback: any;
  updateRHSState: any;
  updateSpaceUsedCallback: any;
  filesFoundMatchingCallback: any;
  updateMatchingFiles: any;
  setFailedFiles: any;
  history: any;
  matchingFiles: Array<Object>;
  storageUsed: number;
  documentsUsed: number;
  storageLimit: number;
  documentsLimit: number;
  setStorageLimitReachedCallback: Function;
};

type State = {
  currentStage: string;
  fileList: Array<Object>;
  totalFileSize: number;
  filesAreAllValid: boolean;
  matchingFiles: Array<Object>;
};

class NewFileUpload extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('NewFileUpload');
    this.state = {
      currentStage: STAGES.BEGIN,
      fileList: [],
      matchingFiles: [],
      totalFileSize: 0,
      filesAreAllValid: true,
    };
  }

  componentDidMount() {}

  componentWillReceiveProps() {}

  @autobind
  /**
   * @param {Array<Object>} acceptedFiles - An array of file objects that match the criteria.
   * @param {Array<Object>} rejectedFiles - An array of file objects that do not match the criteria.
   */
  onDrop(acceptedFiles: Array<Object>, rejectedFiles: Array<Object>) {
    const {
      storageUsed, documentsUsed, storageLimit, documentsLimit,
    } = this.props;
    Log.info(`Accepted Files: ${acceptedFiles.toString()}`);
    if ((rejectedFiles && rejectedFiles.length > 0) || acceptedFiles.length === 0) {
      Log.warn(`Unsupported files detected: ${rejectedFiles.toString()}`);
      openNotificationWithIcon(
        'warning',
        'Oh oh',
        'Some of your files were too large (over 15mb) for us to upload, sorry!',
      );
    } else if (acceptedFiles.length > FILE_UPLOAD_LIMIT) {
      Log.warn(
        `Uploading more than ${FILE_UPLOAD_LIMIT.toString()} files at a time is currently not supported: ${acceptedFiles.toString()}`,
      );
      openNotificationWithIcon(
        'error',
        'File Upload Limit',
        `You can only upload ${FILE_UPLOAD_LIMIT.toString()} files at a time, please upload in batches of ${FILE_UPLOAD_LIMIT.toString()}.`,
      );
      return;
    }

    const {
      updateRHSState,
      setFailedFiles,
      setStageCallback,
      filesFoundMatchingCallback,
      history,
      setStorageLimitReachedCallback,
    } = this.props;

    const { fileList } = this.state;
    let fileSizeSum = 0;
    this.setState({ totalFileSize: 0 });
    this.state.filesAreAllValid = true; // Assume all valid.
    const failedFiles = [];

    _.forIn(acceptedFiles, (value, key) => {
      // Check that the file has a type:
      if (value.type === '') {
        Log.warn(`Failed to determine file type for: ${value.toString()}`);
        openNotificationWithIcon(
          'warning',
          'Unknown File Type',
          `We couldn't figure out the file type for 
          ${value.name}
           via drag-and-drop. We will assume this file is a text file. To determine type, try uploading with the file browser.`,
        );
      }

      // Iterates through the file list object by key.
      if (key !== 'length' && key !== 'item') {
        // Check file size.
        if (value.size > FILE_SIZE_LIMIT) {
          failedFiles.push(value.name);
          this.state.filesAreAllValid = false;
        } else {
          // Check if file already exists.
          if (!value.mimetype) {
            value.mimetype = value.type;
          }
          fileList.push(value); // Add file to the list.

          fileSizeSum += value.size;
        }
      }
      if (parseInt(key, 10) === acceptedFiles.length - 1) {
        if (!this.state.filesAreAllValid) {
          // eslint-disable-line
          if (fileList.length > 0) {
            // Some files are still valid.
            setFailedFiles(failedFiles, false);
          } else {
            // There are no valid files to upload.
            setFailedFiles(failedFiles, true);
          }
          updateRHSState(RHS_STAGES.FILES_EXCEEDING);
          this.setState({ currentStage: STAGES.FILES_EXCEEDING });
        } else {
          // No conflicts, so check for duplicates:
          updateRHSState(RHS_STAGES.LOADING);
          this.setState({ currentStage: STAGES.LOADING_ONE });
          api
            .getListOfDuplicates(fileList)
            .then((result) => {
              if (result.data.length === 0) {
                // Go to comment.
                this.setState({ currentStage: STAGES.COMMENT });
                setStageCallback(RHS_STAGES.COMMENT);
              } else {
                // Go to duplicate matching.
                this.setState({ currentStage: STAGES.DOCUMENT_MATCHING });
                setStageCallback(RHS_STAGES.DOCUMENT_MATCHING);
                filesFoundMatchingCallback(result.data);
              }
            })
            .catch((err) => {
              if (err && err.response && err.response.status === 401) {
                history.push('/login/expired');
              } else {
                Log.error(`Failed to check for duplicate files with error: ${err}`);
                openNotificationWithIcon(
                  'error',
                  'Upload Error',
                  'Failed to check for duplicate files, sorry!',
                );
                this.setState({ currentStage: STAGES.ERROR });
              }
            });
        }
        this.setState({ totalFileSize: fileSizeSum });
        Log.info(`Storage Limit: ${storageLimit} - ${storageUsed} - ${fileSizeSum} < 0`);
        Log.info(`Document Limit: ${documentsLimit} - ${documentsUsed} - ${acceptedFiles.length} < 0`);
        if ((storageLimit - storageUsed - fileSizeSum < 0) || (documentsLimit - documentsUsed - acceptedFiles.length < 0)) {
          openNotificationWithIcon(
            'error',
            'Upload exceeds allowance',
            'This upload would exceed your total free storage, please remove some documents from this upload or forget some documents.',
          );
          setStorageLimitReachedCallback(true);
        } else {
          setStorageLimitReachedCallback(false);
        }
      }
    });
  }

  @autobind
  onClickCancel() {
    const { setStageCallback } = this.props;
    this.setState({ currentStage: STAGES.BEGIN });
    setStageCallback(STAGES.BEGIN);
    this.setState({ fileList: [] });
    this.setState({ totalFileSize: 0 });
  }

  @autobind
  continue(matchingFiles?: Array<Object>) {
    const { currentStage, fileList } = this.state;
    const { setStageCallback, filesFoundMatchingCallback, updateRHSState } = this.props;
    switch (currentStage) {
      case STAGES.FILES_EXCEEDING:
        if (fileList.length > 0) {
          // Determine duplicates:
          updateRHSState(RHS_STAGES.LOADING);
          this.setState({ currentStage: STAGES.LOADING_ONE });
          api
            .getListOfDuplicates(fileList)
            .then((result) => {
              if (result.data.length === 0) {
                // Go to comment.
                this.setState({ currentStage: STAGES.COMMENT });
                setStageCallback(RHS_STAGES.COMMENT);
              } else {
                // Go to duplicate matching.
                this.setState({ currentStage: STAGES.DOCUMENT_MATCHING });
                setStageCallback(RHS_STAGES.DOCUMENT_MATCHING);
                filesFoundMatchingCallback(result.data);
              }
            })
            .catch((err) => {
              Log.error(`Error from getDupes: ${err}`);
              openNotificationWithIcon(
                'error',
                'Upload Error',
                'Failed to check for duplicate files, sorry!',
              );
              this.setState({ currentStage: STAGES.ERROR });
            });
        } else {
          // No valid files, cancel.
          this.onClickCancel();
        }
        break;
      case STAGES.COMMENT:
        break;
      case STAGES.CONFLICT_RESOLUTION:
        break;
      case STAGES.DOCUMENT_MATCHING:
        this.setState({ matchingFiles });
        // Go to comment.
        this.setState({ currentStage: STAGES.COMMENT });
        setStageCallback(RHS_STAGES.COMMENT);
        break;
      default:
        break;
    }
  }

  @autobind
  _onFileChange(event: Object) {
    const {
      updateRHSState,
      storageUsed,
      documentsUsed,
      storageLimit,
      documentsLimit,
      setFailedFiles,
      setStageCallback,
      filesFoundMatchingCallback,
      history,
      setStorageLimitReachedCallback,
    } = this.props;
    const { files } = event.target;
    if (files.length > FILE_UPLOAD_LIMIT) {
      Log.warn(
        `Uploading more than ${FILE_UPLOAD_LIMIT.toString()} files at a time is currently not supported: ${files}`,
      );
      openNotificationWithIcon(
        'error',
        'File Upload Limit',
        `You can only upload ${FILE_UPLOAD_LIMIT.toString()} files at a time, please upload in batches of ${FILE_UPLOAD_LIMIT.toString()}.`,
      );
      return;
    }
    const { fileList } = this.state;
    let fileSizeSum = 0;
    this.setState({ totalFileSize: 0 });
    this.state.filesAreAllValid = true; // Assume all valid.
    const failedFiles = [];
    let value;
    for (let key = 0; key < files.length; key += 1) {
      value = files[key];
      // Check file size.
      if (value.size > FILE_SIZE_LIMIT) {
        failedFiles.push(value.name);
        this.state.filesAreAllValid = false;
      } else {
        // Check if file already exists.
        fileList.push(value); // Add file to the list.
        fileSizeSum += value.size;
      }

      if (parseInt(key, 10) === files.length - 1) {
        if (!this.state.filesAreAllValid) {
          // eslint-disable-line
          if (fileList.length > 0) {
            // Some files are still valid.
            setFailedFiles(failedFiles, false);
          } else {
            // There are no valid files to upload.
            setFailedFiles(failedFiles, true);
          }
          updateRHSState(RHS_STAGES.FILES_EXCEEDING);
          this.setState({ currentStage: STAGES.FILES_EXCEEDING });
        } else {
          // No conflicts, so check for duplicates:
          updateRHSState(RHS_STAGES.LOADING);
          this.setState({ currentStage: STAGES.LOADING_ONE });
          api
            .getListOfDuplicates(fileList)
            .then((result) => {
              if (result.data.length === 0) {
                // Go to comment.
                this.setState({ currentStage: STAGES.COMMENT });
                setStageCallback(RHS_STAGES.COMMENT);
              } else {
                // Go to duplicate matching.
                this.setState({ currentStage: STAGES.DOCUMENT_MATCHING });
                setStageCallback(RHS_STAGES.DOCUMENT_MATCHING);
                filesFoundMatchingCallback(result.data);
              }
            })
            .catch((err) => {
              if (err && err.response && err.response.status === 401) {
                history.push('/login/expired');
              } else {
                Log.error(`Failed to check for duplicate files with error: ${err}`);
                openNotificationWithIcon(
                  'error',
                  'Upload Error',
                  'Failed to check for duplicate files, sorry!',
                );
                this.setState({ currentStage: STAGES.ERROR });
              }
            });
        }
        this.setState({ totalFileSize: fileSizeSum });
        Log.info(`Storage Limit: ${storageLimit} - ${storageUsed} - ${fileSizeSum} < 0`);
        Log.info(`Document Limit: ${documentsLimit} - ${documentsUsed} - ${files.length} < 0`);
        if ((storageLimit - storageUsed - fileSizeSum < 0) || (documentsLimit - documentsUsed - files.length < 0)) {
          openNotificationWithIcon(
            'error',
            'Upload exceeds allowance',
            'This upload would exceed your total free storage, please remove some documents from this upload or forget some documents.',
          );
          setStorageLimitReachedCallback(true);
        } else {
          setStorageLimitReachedCallback(false);
        }
      }
    }
  }

  @autobind
  duplicateUpload(comment: string, commentTags: Array<string>) {
    const {
      setStageCallback,
      swapTabCallback,
      updateSpaceUsedCallback,
      // filesFoundMatchingCallback,
    } = this.props;
    const { fileList, matchingFiles } = this.state;
    const dupeUploads = [];
    const match = _.intersectionBy(fileList, matchingFiles, 'name');
    const nonDupeUploads = _.xorBy(fileList, matchingFiles, 'name');

    match.forEach((val) => {
      if (!matchingFiles[_.findIndex(matchingFiles, { name: val.name })].isDupe) {
        // Value has been marked as a new document.
        nonDupeUploads.push(val);
      } else {
        dupeUploads.push(val);
      }
    });

    // Upload non duplicates
    this.setState({ currentStage: STAGES.LOADING });
    setStageCallback(STAGES.LOADING_TWO);
    api
      .uploadFiles(nonDupeUploads, true, comment, commentTags)
      .then((uploadRes) => {
        if (uploadRes.data.uploadComplete === true) {
          // Upload Duplicates
          api
            .uploadNewVersions(dupeUploads, comment, commentTags)
            .then(() => {
              this.onClickCancel();
              swapTabCallback(true);
              api
                .getFileSizeForUser()
                .then((res) => {
                  openNotificationWithIcon(
                    'success',
                    'Upload Complete',
                    'Your files have been uploaded!',
                  );
                  // Twitter conversion event.
                  window.twq('track', 'Upload');
                  // Adwords conversion.
                  window.gtag_report_conversion('http://provendocs.com/Upload');
                  // Facebook conversion.
                  window.fbq('track', 'StartTrial', { value: '0.00', currency: 'USD', predicted_ltv: '0.00' });
                  if (res && res.data.filesSize && res.data.filesSize[0]) {
                    updateSpaceUsedCallback(res.data.filesSize[0].storageUsed, res.data.filesSize[0].documentsUsed);
                  } else if (res && res.data) {
                    updateSpaceUsedCallback(res.data.storageUsed, res.data.documentsUsed);
                  } else {
                    console.error('No File Size info for user: ', res);
                  }
                })
                .catch((err) => {
                  Log.error('Error fetching files size: ');
                  console.error(err);
                  openNotificationWithIcon(
                    'error',
                    'Upload Error',
                    'Failed to fetch size of files, sorry!',
                  );
                  this.setState({ currentStage: STAGES.ERROR });
                });
            })
            .catch((err) => {
              Log.error(`Failed to upload files with error: ${err}`);
              openNotificationWithIcon(
                'error',
                'Upload Error',
                'Failed to upload your files, sorry!',
              );
              this.setState({ currentStage: STAGES.ERROR });
            });
        } else {
          // Upload Duplicates
          api
            .uploadNewVersions(dupeUploads, '', [])
            .then(() => {
              openNotificationWithIcon(
                'success',
                'Upload Complete',
                'Your files have been uploaded!',
              );
              // Twitter conversion event.
              window.twq('track', 'Upload');
              // Adwords conversion.
              window.gtag_report_conversion('http://provendocs.com/Upload');
              // Facebook conversion.
              window.fbq('track', 'StartTrial', {
                value: '0.00', currency: 'USD', predicted_ltv: '0.00', service: 'provendocs_early_access',
              });
              this.onClickCancel();
              swapTabCallback(true);
              api
                .getFileSizeForUser()
                .then((res) => {
                  Log.info('File Size Result: ');
                  Log.info(res);
                  if (res && res.data.filesSize && res.data.filesSize[0]) {
                    updateSpaceUsedCallback(res.data.filesSize[0].storageUsed, res.data.filesSize[0].documentsUsed);
                  } else if (res && res.data) {
                    updateSpaceUsedCallback(res.data.storageUsed, res.data.documentsUsed);
                  } else {
                    console.error('No File Size info for user: ', res);
                  }
                })
                .catch((err) => {
                  Log.error('Error fetching files size: ');
                  console.error(err);
                  openNotificationWithIcon(
                    'error',
                    'Upload Error',
                    'Failed to fetch size of files, sorry!',
                  );
                  this.setState({ currentStage: STAGES.ERROR });
                });
            })
            .catch((err) => {
              Log.error(`Failed to upload files with err: ${err}`);
              openNotificationWithIcon(
                'error',
                'Upload Error',
                'Failed to upload your files, sorry!',
              );
              this.setState({ currentStage: STAGES.ERROR });
            });
        }
      })
      .catch((err) => {
        Log.error(`Failed to upload files with error: ${err}`);
        openNotificationWithIcon('error', 'Upload Error', 'Failed to upload your files, sorry!');
        this.setState({ currentStage: STAGES.ERROR });
      });
  }

  @autobind
  _removeFile(index: number) {
    const { totalFileSize, fileList } = this.state;
    const {
      updateRHSState,
      matchingFiles,
      updateMatchingFiles,
      setStorageLimitReachedCallback,
      storageUsed,
      documentsUsed,
      storageLimit,
      documentsLimit,
    } = this.props;
    const { size } = fileList[index];
    const newTotalFileSize = totalFileSize - size;

    Log.info(`Storage Limit: ${storageLimit} - ${storageUsed} - ${newTotalFileSize} < 0`);
    Log.info(`Document Limit: ${documentsLimit} - ${documentsUsed} - ${fileList.length} + 1 < 0`);
    if ((storageLimit - storageUsed - newTotalFileSize < 0) || (documentsLimit - documentsUsed - fileList.length + 1 < 0)) {
      openNotificationWithIcon(
        'error',
        'Upload exceeds allowance',
        'This upload would (still) exceed your total free storage, please remove some documents from this upload or forget some documents.',
      );
      setStorageLimitReachedCallback(true);
    } else {
      setStorageLimitReachedCallback(false);
    }

    // First, check if the file being deleted is in the matching files list:
    matchingFiles.forEach((matchFile, matchIndex) => {
      if (matchFile.name === fileList[index].name) {
        matchingFiles.splice(matchIndex, 1);
      }
    });

    // Then remove file from original file list.
    fileList.splice(index, 1);

    // Now check that all remaining files are valid.
    this.setState({ totalFileSize: newTotalFileSize });
    this.state.filesAreAllValid = true;
    fileList.forEach((file) => {
      if (file.size > FILE_SIZE_LIMIT) {
        this.state.filesAreAllValid = false;
      }
    });

    // If there are no files left, return to upload widget.
    if (fileList.length === 0) {
      this.onClickCancel();
    } else {
      // Still some duplicates remaining, stay in current stage but update RHS.
      if (matchingFiles.length > 0) {
        updateMatchingFiles(matchingFiles);
      } else if (this.state.filesAreAllValid) {
        // eslint-disable-line
        updateRHSState(RHS_STAGES.COMMENT);
      }
      this.forceUpdate();
    }
  }

  @autobind
  _renderFileList() {
    const { fileList } = this.state;
    const rows = [];

    // Assume all files are below 16mb.
    fileList.forEach((file, key) => {
      let validClass = 'valid';

      const result = convertBytes(file.size, 'b', 3);
      if (file.size > FILE_SIZE_LIMIT) {
        validClass = 'invalid';
      }

      // If any files is over 16mb, it is invalid and they cannot proceed.
      rows.push(
        <div className={`row ${validClass}`}>
          <span className="fileName">{file.name}</span>
          <span className={`fileSize ${validClass}`}>
            {result.value}
            {' '}
            {result.unit}
          </span>
          <ForgetIcon
            className="removeButton"
            onClick={() => {
              this._removeFile(key);
            }}
          />
        </div>,
      );
    });
    return rows;
  }

  render() {
    const { totalFileSize, currentStage } = this.state;
    const result = convertBytes(totalFileSize, 'b', 3);
    switch (currentStage) {
      case STAGES.ERROR:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper">
              <Error
                title="Failed Upload"
                message="Apologies, we failed to upload your file to ProvenDocs for an unknown reason."
              />
              <Button className="continueButton" onClick={() => this.onClickCancel()}>
                Continue
              </Button>
            </div>
          </div>
        );
      case STAGES.BEGIN:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper">
              <Dropzone
                className="dropZone"
                disableClick
                activeClassName="activeDropZone"
                disabledClassName="disabledDropZone"
                acceptClassName="acceptDropZone"
                rejectClassName="rejectDropZone"
                onDrop={this.onDrop}
                getDataTransferItems={evt => fromEvent(evt)}
                maxSize={FILE_SIZE_LIMIT}
                maxFiles={FILE_UPLOAD_LIMIT}
              >
                <div className="chooseFilesWrapper">
                  <FileIcon />
                  <h2 className="sectionTitle">Upload a file or folder to get started!</h2>
                  <span className="sectionMessage">
                    {`Upload up to ${FILE_UPLOAD_LIMIT.toString()} files at a time by browsing, dragging a file into this section or emailing a
                    document to`}
                    {' '}
                    <a href="mailto:uploads@upload.provendocs.com">Uploads@Upload.ProvenDocs.com</a>
                    {' '}
                  </span>
                  <div className="inputWrapper whiteButton">
                    <input
                      className="whiteButton browseFilesButton"
                      name="files"
                      type="file"
                      onChange={this._onFileChange}
                      multiple
                    />
                    <span className="inputLabel">Browse Files</span>
                  </div>
                  <span className="fileSizeMessage">Maximum upload file size: 16 MB</span>
                </div>
              </Dropzone>
            </div>
          </div>
        );
      case STAGES.FILE_SUMMARY:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper full">
              <div className="fileSummaryListWrapper">
                <div className="fileList">
                  <div className="row header">
                    <span className="headerLabel">Upload Overview:</span>
                    <span className="totalLabel">
                      Total:
                      {' '}
                      {result.value}
                      {' '}
                      {result.unit}
                    </span>
                  </div>
                  {this._renderFileList()}
                </div>
              </div>
            </div>
          </div>
        );
      case STAGES.FILES_EXCEEDING:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper full">
              <div className="fileSummaryListWrapper disabled">
                <div className="fileList">
                  <div className="row header">
                    <span className="headerLabel">Upload Overview:</span>
                    <span className="totalLabel">
                      Total:
                      {' '}
                      {result.value}
                      {' '}
                      {result.unit}
                    </span>
                  </div>
                  {this._renderFileList()}
                </div>
              </div>
            </div>
          </div>
        );

      case STAGES.COMMENT:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper full">
              <div className="fileSummaryListWrapper disabled">
                <div className="fileList">
                  <div className="row header">
                    <span className="headerLabel">Upload Overview:</span>
                    <span className="totalLabel">
                      Total:
                      {' '}
                      {result.value}
                      {' '}
                      {result.unit}
                    </span>
                  </div>
                  {this._renderFileList()}
                </div>
              </div>
            </div>
          </div>
        );

      case STAGES.DOCUMENT_MATCHING:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper full">
              <div className="fileSummaryListWrapper disabled">
                <div className="fileList">
                  <div className="row header">
                    <span className="headerLabel">Upload Overview:</span>
                    <span className="totalLabel">
                      Total:
                      {' '}
                      {result.value}
                      {' '}
                      {result.unit}
                    </span>
                  </div>
                  {this._renderFileList()}
                </div>
              </div>
            </div>
          </div>
        );

      case STAGES.LOADING:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper">
              <Loading isFullScreen={false} message="Uploading your documents to ProvenDocs..." />
            </div>
          </div>
        );
      case STAGES.LOADING_ONE:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper">
              <Loading isFullScreen={false} message="Checking your documents for duplicates..." />
            </div>
          </div>
        );
      case STAGES.LOADING_TWO:
        return (
          <div className=" newFileUpload subWrapper">
            <div className="contentWrapper">
              <Loading isFullScreen={false} message="Uploading your documents to ProvenDocs..." />
            </div>
          </div>
        );
      default:
        return <div />;
    }
  }
}

export default NewFileUpload;
