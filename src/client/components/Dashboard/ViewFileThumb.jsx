/*
 * @flow
 * @Author: Wahaj Shamim <wahaj>
 * @Date:   2019-03-25T13:30:22+11:00
 * @Email:  wahaj@southbanksoftware.com
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-01T12:34:33+11:00
 *
 * Copyright (c) 2019 Southbank Software
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
        // return (
        //   <div className={`docPreview pdf ${selectedClass} loading_${loadingClass}`}>
        //     <PDFIcon className="pdfIcon" />
        //   </div>
        // );
        className = 'pdf';
        break;
      case MIMETYPES.PNG:
        className = 'png';
        break;
      case MIMETYPES.SVG:
        className = 'svg';
        break;
      // return (
      //   <div className={`docPreview pdf svg ${selectedClass} loading_${loadingClass}`}>
      //     <DocumentIcon className="docIcon" />
      //   </div>
      // );
      case MIMETYPES.TEXT:
        className = 'txt';
        break;
      case MIMETYPES.DOC:
      case MIMETYPES.DOCX:
        className = 'doc';
        break;
      // return (
      //   <div className={`docPreview pdf doc ${selectedClass} loading_${loadingClass}`}>
      //     <WordDocumentIcon className="wordIcon" />
      //   </div>
      // );
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
            <DocumentIcon className="docIcon" />
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
        {file.content !== '' && <img src={file.content} alt={file.fileName} />}
        {file.content === '' && className === 'pdf' && <PDFIcon className="pdfIcon" />}
        {file.content === ''
          && (className === 'jpeg' || className === 'png' || className === 'svg') && (
            <ImageIcon className="imgIcon" />
        )}
        {file.content === '' && className === 'doc' && <WordDocumentIcon className="wordIcon" />}
        {file.content === ''
          && (className === 'UNKOWN'
            || className === 'email'
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
    if (file.mimetype === MIMETYPES.DOC || file.mimetype === MIMETYPES.DOCX) {
      return <div className="fileTypeFooter doc">DOC</div>;
    }
    if (file.mimetype === MIMETYPES.EMAIL) {
      return <div className="fileTypeFooter email">EMAIL</div>;
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
