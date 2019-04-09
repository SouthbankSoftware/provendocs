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
import { Position, Tooltip } from '@blueprintjs/core';
import { notification } from 'antd';

import { api, Log } from '../../common';
import { MIMETYPES, PROOF_STATUS } from '../../common/constants';

import CrossIcon from '../../style/icons/pages/dashboard/cross-icon.svg';
import PendingIcon from '../../style/icons/pages/dashboard/uploading-icon.svg';
import TickIcon from '../../style/icons/pages/dashboard/tick-icon.svg';
import PDFIcon from '../../style/icons/pages/dashboard/pdf-document-icon.svg';
import ImageIcon from '../../style/icons/pages/dashboard/img-icon.svg';
import DocumentIcon from '../../style/icons/pages/dashboard/document-icon.svg';
import WordDocumentIcon from '../../style/icons/pages/dashboard/word-thumbnail-icon.svg';
import ExcelDocumentIcon from '../../style/icons/pages/dashboard/excel-thumbnail-icon.svg';
import QuestionMarkIcon from '../../style/icons/pages/dashboard/question-mark-icon.svg';
import PowerPointIcon from '../../style/icons/pages/dashboard/powerpoint-thumbnail-icon.svg';
import { Loading } from '../Common';

const openNotificationWithIcon = (type: string, title: string, message: string) => {
  notification[type]({
    message: title,
    description: message,
  });
};

type Props = {
  file: any,
  selectedClass: string,
};
type State = {
  file: any,
};
export default class ViewFileThumb extends React.Component<Props, State> {
  constructor() {
    super();
    Log.setSource('ViewFileThumb');
    this.state = {
      file: null,
    };
  }

  componentWillMount() {
    const { file } = this.props;
    file.isLoading = true;
    this.setState({ file });
  }

  componentDidMount() {
    const { file } = this.props;
    this._getFilePreview(file)
      .then((previewResult) => {
        if (previewResult.data.status) {
          file.proofInfo = previewResult.data.status;
        } else {
          file.proofInfo = PROOF_STATUS.FAILED;
        }
        file.content = previewResult.data.content;
        file.fileName = previewResult.data.fileName;
        file.isLoading = false;
        this.setState({
          file,
        });
      })
      .catch((err) => {
        file.isLoading = false;
        file.hasFailed = true;
        openNotificationWithIcon('error', 'Error', 'Failed to get file preview, sorry!');
        Log.error(`Error getting File Preview: ${err}`);
        this.setState({
          file,
        });
      });
  }

  componentWillReceiveProps(nextProps: Object) {
    const { file } = this.state;
    if (nextProps.file && nextProps.file.name !== file.name) {
      // New file, update state.
      nextProps.file.isLoading = true;
      console.log('Setting State to: ', nextProps.file.name);
      this.setState({ file: nextProps.file });
      this.state.file = nextProps.file;
      const newFile = nextProps.file;
      this._getFilePreview(newFile)
        .then((previewResult) => {
          console.log('Fetched for: ', newFile.name);
          console.log('Current: ', this.state.file.name);
          if (newFile.name !== this.state.file.name) {
            // A new file has been selected, disregard result of this fetch.
            Log.trace(
              'A new file has been selected while proof was fetching, therefore this preview has been disregarded.',
            );
            return;
          }
          if (previewResult.data.status) {
            newFile.proofInfo = previewResult.data.status;
          } else {
            newFile.proofInfo = PROOF_STATUS.FAILED;
          }
          newFile.content = previewResult.data.content;
          newFile.fileName = previewResult.data.fileName;
          newFile.isLoading = false;
          this.setState({
            file: newFile,
          });
        })
        .catch((err) => {
          newFile.isLoading = false;
          newFile.hasFailed = true;
          openNotificationWithIcon('error', 'Error', 'Failed to get file preview, sorry!');
          Log.error(`Error getting File Preview: ${err}`);
          this.setState({
            file: newFile,
          });
        });
    }
  }

  _getFilePreview = (file: Object) => new Promise<any>((resolve, reject) => {
    api
      .getFilePreviewForUser(file._id)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        openNotificationWithIcon('error', 'Error', 'Failed to get file preview, sorry!');
        Log.error(`Failed to get file preview with error: ${error}`);
        reject(error);
      });
  });

  renderFileByType = (file: Object, selectedClass: string) => {
    const { mimetype, loadingClass } = file;
    if (file.hasFailed) {
      return (
        <Tooltip content="Sorry, failed to fetch preview!" position={Position.TOP}>
          <div className="docPreview pdf">
            <CrossIcon className="crossIcon" />
          </div>
        </Tooltip>
      );
    }

    let className = 'UNKOWN';
    switch (mimetype) {
      case MIMETYPES.EMAIL:
        className = 'email';
        break;
      case MIMETYPES.HTML:
        className = 'email';
        break;
      case MIMETYPES.JPEG:
        className = 'jpeg';
        break;
      case MIMETYPES.JSON:
        className = 'txt';
        break;
      case MIMETYPES.OCTET_STREAM:
        className = 'txt';
        break;
      case MIMETYPES.PDF:
        className = 'pdf';
        break;
      case MIMETYPES.PNG:
        className = 'png';
        break;
      case MIMETYPES.SVG:
        className = 'svg';
        break;
      case MIMETYPES.TEXT:
        className = 'txt';
        break;
      case MIMETYPES.DOC:
      case MIMETYPES.DOCX:
        className = 'doc';
        break;
      case MIMETYPES.PPT:
      case MIMETYPES.PPTX:
        return (
          <div className={`docPreview pdf ppt ${selectedClass} loading_${loadingClass}`}>
            <PowerPointIcon className="pptIcon" />
          </div>
        );
      case MIMETYPES.XLSX:
        return (
          <div className={`docPreview pdf xlsx ${selectedClass} loading_${loadingClass}`}>
            <ExcelDocumentIcon className="excelIcon" />
          </div>
        );
      case MIMETYPES.JS:
        className = 'js txt';
        break;
      case MIMETYPES.SHELL:
        className = 'shell txt';
        break;
      default:
        return (
          <div className={`docPreview pdf ${selectedClass} loading_${loadingClass}`}>
            <QuestionMarkIcon className="unknownIcon" />
          </div>
        );
    }

    if (file.isLoading) {
      return (
        <div className={`docPreview loading ${selectedClass} loading_${loadingClass}`}>
          <Loading isFullScreen={false} />
        </div>
      );
    }

    return (
      <div readOnly disabled className={`docPreview ${className} loading_${loadingClass}`}>
        {file.content !== '' && className !== 'email' && (
          <img src={file.content} alt={file.fileName} />
        )}
        {file.content !== '' && className === 'email' && <DocumentIcon className="docIcon" />}
        {file.content === '' && className === 'pdf' && <PDFIcon className="pdfIcon" />}
        {file.content === ''
          && (className === 'jpeg' || className === 'png' || className === 'svg') && (
            <ImageIcon className="imgIcon" />
        )}
        {file.content === '' && className === 'doc' && <WordDocumentIcon className="wordIcon" />}
        {file.content === ''
          && (className === 'email'
            || className === 'js txt'
            || className === 'shell txt'
            || className === 'txt') && <DocumentIcon className="docIcon" />}
      </div>
    );
  };

  renderFileProofStatus = (file: Object) => {
    const { proofInfo } = file;
    if (!proofInfo) {
      return <PendingIcon className="pendingIcon" />;
    }
    switch (proofInfo) {
      case PROOF_STATUS.FAILED:
        return <CrossIcon className="crossIcon" />;
      case PROOF_STATUS.VALID:
        return <TickIcon className="tickIcon" />;
      case PROOF_STATUS.PENDING:
        return <PendingIcon className="pendingIcon" />;
      case PROOF_STATUS.SUBMITTED:
        return <PendingIcon className="pendingIcon" />;
      default:
        return <CrossIcon className="crossIcon" />;
    }
  };

  renderFileTypeFooter = (file: Object) => {
    if (file.mimetype === MIMETYPES.PDF) {
      return <div className="fileTypeFooter pdf">PDF</div>;
    }
    if (
      file.mimetype === MIMETYPES.TEXT
      || file.mimetype === MIMETYPES.JSON
      || file.mimetype === MIMETYPES.OCTET_STREAM
      || file.mimetype === MIMETYPES.LOG
    ) {
      return <div className="fileTypeFooter doc">TEXT</div>;
    }
    if (file.mimetype === MIMETYPES.SHELL || file.mimetype === MIMETYPES.JS) {
      return <div className="fileTypeFooter code">CODE</div>;
    }
    if (file.mimetype === MIMETYPES.XLSX) {
      return <div className="fileTypeFooter xlsx">XLSX</div>;
    }
    if (
      file.mimetype === MIMETYPES.PNG
      || file.mimetype === MIMETYPES.SVG
      || file.mimetype === MIMETYPES.JPEG
    ) {
      return <div className="fileTypeFooter img">IMAGE</div>;
    }
    if (file.mimetype === MIMETYPES.DOC) {
      return <div className="fileTypeFooter doc">DOC</div>;
    }
    if (file.mimetype === MIMETYPES.DOCX) {
      return <div className="fileTypeFooter doc">DOCX</div>;
    }
    if (file.mimetype === MIMETYPES.EMAIL) {
      return <div className="fileTypeFooter email">EMAIL</div>;
    }
    if (file.mimetype === MIMETYPES.PPT) {
      return <div className="fileTypeFooter ppt">PPT</div>;
    }
    if (file.mimetype === MIMETYPES.PPTX) {
      return <div className="fileTypeFooter ppt">PPTX</div>;
    }

    Log.warn('Unknown file type: ');
    Log.warn(file);
    return <div className="fileTypeFooter unknown">UNKNOWN</div>;
  };

  render() {
    const { file } = this.state;
    const { selectedClass } = this.props;
    return (
      <React.Fragment>
        {this.renderFileByType(file, selectedClass)}
        {this.renderFileProofStatus(file)}
        {this.renderFileTypeFooter(file)}
      </React.Fragment>
    );
  }
}
