/* @flow
 * @Author: Michael Harrison
 * @Date:   2018-12-07T11:42:20+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-15T17:31:33+11:00
 */
import React from 'react';
import { withRouter } from 'react-router';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Dialog, Switch, TagInput } from '@blueprintjs/core';
import autobind from 'autobind-decorator';
import { Button } from 'antd';
import { Loading } from '../Common';
import { openNotificationWithIcon } from '../../common/util';
import { api } from '../../common';
import Log from '../../common/log';
// $FlowFixMe
import './ShareDialog.scss';
import { ANTD_BUTTON_TYPES } from '../../common/constants';

const STATES = {
  DEFAULT: 'default',
  LOADING: 'loading',
  CREATING_LINK: 'creatingLink',
  LINK_READY: 'linkReady',
  FAILED: 'failed',
  SELECT_FILE: 'selectFile',
};

type Props = {
  file: any;
  onClose: any;
  isOpen: any;
  fileVersion: number;
  history: any;
};

type State = {
  currentState: string;
  emailList: Array<string>;
  isEmail: any;
  error: string;
  isShared: boolean;
  shareURL: string;
  sharedEmails: Array<string>;
  emailURL: string;
};

Log.setSource('ShareDialog');

class ShareDialog extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      currentState: STATES.LOADING,
      isEmail: true,
      emailList: [],
      error: '',
      isShared: false,
      shareURL: '',
      emailURL: '',
      sharedEmails: [],
    };
  }

  componentDidMount() {
    this.checkShareStatus(null);
  }

  componentWillReceiveProps() {
    this.checkShareStatus(null);
  }

  checkShareStatus(email: boolean | null) {
    const { file, history } = this.props;
    let { fileVersion } = this.props;
    if (!fileVersion) {
      fileVersion = file && file._provendb_metadata ? file._provendb_metadata.minVersion : 0;
    }
    const { isEmail } = this.state;
    if (email) {
      this.setState({ isEmail: true });
    } else {
      this.setState({ isEmail: false });
    }

    api
      .getShareStatus(file._id, fileVersion)
      .then((res) => {
        const shareInfo = res.data;
        if (shareInfo.shared) {
          this.state.sharedEmails = shareInfo.emails || [];
          this.state.emailList = shareInfo.emails || [];
          this.state.emailURL = shareInfo.emailLink || '';
          this.state.shareURL = shareInfo.link || '';
          this.state.isShared = true;
          this.state.error = '';
        } else {
          this.state.isShared = false;
          this.state.sharedEmails = [];
          this.state.emailList = [];
          this.state.shareURL = '';
          this.state.error = '';
        }
        if (!isEmail && shareInfo.shared && shareInfo.link) {
          this.setState({ currentState: STATES.LINK_READY });
        } else {
          this.setState({ currentState: STATES.DEFAULT });
        }
      })
      .catch((err) => {
        if (err && err.response && err.response.status === 401) {
          history.push('/login/expired');
        } else {
          openNotificationWithIcon('error', 'Error', 'Failed to get share status for file sorry.');
          Log.error(`Err getting share statust: ${err}`);
          this.setState({ currentState: STATES.FAILED });
        }
      });
  }

  @autobind
  _handleChangeSwitch() {
    const { isEmail, isShared, shareURL } = this.state;
    if (isEmail && isShared && shareURL) {
      this.setState({ currentState: STATES.LINK_READY });
    } else {
      this.setState({ currentState: STATES.DEFAULT });
    }
    this.setState({ isEmail: !isEmail });
  }

  @autobind
  _submitShare() {
    const { file } = this.props;
    let { fileVersion } = this.props;
    if (!fileVersion) {
      fileVersion = file && file._provendb_metadata ? file._provendb_metadata.minVersion : 0;
    }
    const { isEmail, emailList } = this.state;
    if (isEmail) {
      this.setState({ currentState: STATES.CREATING_LINK });
      api
        .createShareEmail(file._id, fileVersion, emailList)
        .then(() => {
          openNotificationWithIcon('success', 'Shared!', 'Your file has been shared.');
          this.checkShareStatus(true);
        })
        .catch((err) => {
          openNotificationWithIcon('error', 'Error', 'Failed to share your file via email, sorry.');
          Log.error(`Err sharing email: ${err}`);
          this.checkShareStatus(null);
        });
    } else {
      this.setState({ currentState: STATES.CREATING_LINK });
      api
        .createShareLink(file._id, fileVersion)
        .then((res) => {
          openNotificationWithIcon('success', 'Shared!', 'Your file is now shared!');
          this.setState({ shareURL: res.data });
          this.setState({ currentState: STATES.LINK_READY });
        })
        .catch((err) => {
          openNotificationWithIcon(
            'error',
            'Error',
            'Failed to create a share link for your file, sorry.',
          );
          Log.error(`Err creating share link: ${err}`);
          this.setState({ currentState: STATES.SELECT_FILE });
        });
    }
  }

  @autobind
  _clearShareStatus(fileId: string, fileVersion: number, type: string) {
    this.state = {
      currentState: STATES.LOADING,
      isEmail: type === 'email',
      emailList: [],
      error: '',
      isShared: false,
      shareURL: '',
      emailURL: '',
      sharedEmails: [],
    };
    this.setState({ currentState: STATES.LOADING });
    api
      .clearShareStatus(fileId, fileVersion, type)
      .then(() => {
        openNotificationWithIcon('success', 'Unshared', 'Your file is no longer shared.');
        this.checkShareStatus(type === 'email');
      })
      .catch((err) => {
        openNotificationWithIcon('error', 'Error', 'Failed to unshare your file, sorry!');
        Log.error(`Err unsharing file: ${err}`);
        this.setState({ currentState: STATES.FAILED });
      });
  }

  @autobind
  _resetState() {
    this.state = {
      currentState: STATES.LOADING,
      isEmail: true,
      emailList: [],
      error: '',
      isShared: false,
      shareURL: '',
      sharedEmails: [],
      emailURL: '',
    };
  }

  render() {
    const {
      currentState,
      isEmail,
      emailList,
      error,
      shareURL,
      isShared,
      sharedEmails,
      emailURL,
    } = this.state;
    const { isOpen, onClose, file } = this.props;
    let { fileVersion } = this.props;
    if (!fileVersion) {
      fileVersion = file && file._provendb_metadata && file._provendb_metadata.minVersion
        ? file._provendb_metadata.minVersion
        : 0;
    }

    if (!isOpen) {
      return <div />;
    }
    // const { file } = this.props;
    if (currentState === STATES.LOADING) {
      return (
        <Dialog
          className="shareDialog"
          isOpen={isOpen}
          onClose={() => {
            this._resetState();
            onClose();
          }}
        >
          <div className="header">
            <div className="left" />
            <div
              className="right close"
              onClick={() => {
                this._resetState();
                onClose();
              }}
              role="button"
              tabIndex={0}
            >
              x
            </div>
          </div>
          <div className="body loading">
            <Loading isFullScreen={false} color="#3b5998" message="Please wait..." />
          </div>
        </Dialog>
      );
    }
    if (currentState === STATES.LINK_READY) {
      return (
        <Dialog
          className="shareDialog"
          isOpen={isOpen}
          onClose={() => {
            this._resetState();
            onClose();
          }}
        >
          <div className="header">
            <div className="left" />
            <div
              className="right close"
              onClick={() => {
                this._resetState();
                onClose();
              }}
              role="button"
              tabIndex={0}
            >
              x
            </div>
          </div>
          <div className="body">
            <span className="title">Share Blockchain Proof</span>
            <span className="description">Your link is below:</span>
            <div className="typeSwitch">
              <span className={`link bold_${!isEmail}`}>Link</span>
              <Switch checked={isEmail} onChange={this._handleChangeSwitch} />
              <span className={`email bold_${isEmail}`}>Email</span>
            </div>
            <div className="urlWrapper">
              <div className="url">
                <a href={shareURL}>{shareURL}</a>
              </div>
            </div>
            <div className="linkButtons">
              <Button
                className="blueButton clear"
                type={ANTD_BUTTON_TYPES.PRIMARY}
                onClick={() => {
                  this._clearShareStatus(file._id, fileVersion, 'link');
                }}
                text="Unshare"
              >
                Unshare
              </Button>
              <CopyToClipboard text={shareURL}>
                <Button
                  className="blueButton copy"
                  text="Copy"
                  onClick={() => {
                    openNotificationWithIcon(
                      'success',
                      'Copied',
                      'The link has been copied to clipboard.',
                    );
                  }}
                >
                  Copy to Clipboard
                </Button>
              </CopyToClipboard>
            </div>
          </div>
        </Dialog>
      );
    }
    if (currentState === STATES.FAILED) {
      return (
        <Dialog
          className="shareDialog"
          isOpen={isOpen}
          onClose={() => {
            this._resetState();
            onClose();
          }}
        >
          <div className="header">
            <div className="left" />
            <div
              className="right close"
              onClick={() => {
                this._resetState();
                onClose();
              }}
              role="button"
              tabIndex={0}
            >
              x
            </div>
          </div>
          <div className="body">Apologies, sharing has failed.</div>
        </Dialog>
      );
    }

    // Main View
    let description;
    let bottomButton;

    if (isEmail) {
      if (isShared && sharedEmails && sharedEmails.length > 0) {
        description = 'You have shared this link with the emails below:';
        bottomButton = (
          <div className="buttons">
            <Button
              disabled={emailList.length <= 0}
              className="blueButton clear"
              onClick={() => {
                this._clearShareStatus(file._id, fileVersion, 'email');
              }}
              text="Unshare"
              type={ANTD_BUTTON_TYPES.DANGER}
            >
              Unshare
            </Button>
            <Button
              disabled={emailList.length === 0}
              className="blueButton submit"
              onClick={this._submitShare}
              type={ANTD_BUTTON_TYPES.PRIMARY}
              text="Send"
            >
              Send More
            </Button>
          </div>
        );
      } else {
        description = 'Share your proof with someone by email.';
        bottomButton = (
          <div className="buttons">
            <Button
              disabled={!emailList || (emailList && emailList.length === 0)}
              className="blueButton submit"
              onClick={this._submitShare}
              loading={currentState === STATES.CREATING_LINK}
            >
              Send Email
            </Button>
          </div>
        );
      }
    } else if (isShared && shareURL) {
      description = 'Share your proof using the link below:';
      bottomButton = (
        <div className="linkButtons">
          <Button
            className="blueButton submit"
            onClick={() => {
              this._clearShareStatus(file._id, fileVersion, 'url');
            }}
            text="Unshare"
            type={ANTD_BUTTON_TYPES.DANGER}
          >
            Make Private
          </Button>
          <CopyToClipboard text={shareURL}>
            <Button
              className="blueButton copy"
              text="Copy"
              onClick={() => {
                openNotificationWithIcon(
                  'success',
                  'Copied',
                  'The link has been copied to clipboard.',
                );
              }}
            >
              Copy to Clipboard
            </Button>
          </CopyToClipboard>
        </div>
      );
    } else {
      description = 'Share your proof with someone by creating a link.';
      bottomButton = (
        <Button
          className="blueButton submit primaryButton"
          onClick={this._submitShare}
          loading={currentState === STATES.CREATING_LINK}
        >
          Make Public
        </Button>
      );
    }

    return (
      <Dialog
        className="shareDialog"
        isOpen={isOpen}
        onClose={() => {
          this._resetState();
          onClose();
        }}
      >
        <div className="header">
          <div className="left" />
          <div
            className="right close"
            onClick={() => {
              this._resetState();
              onClose();
            }}
            role="button"
            tabIndex={0}
          >
            x
          </div>
        </div>
        <div className="body">
          <span className="title">Share Blockchain Proof</span>
          <span className="description">{description}</span>
          <div className="typeSwitch">
            <span className={`link bold_${!isEmail}`}>Link</span>
            <Switch checked={isEmail} onChange={this._handleChangeSwitch} />
            <span className={`email bold_${isEmail}`}>Email</span>
          </div>
          {!isEmail && isShared && shareURL && (
            <div className="urlWrapper">
              <div className="url">
                <a href={emailURL}>{shareURL}</a>
                <span className="publicNotice">Note: This proof is currently public.</span>
              </div>
            </div>
          )}
          {isEmail && isShared && sharedEmails && emailURL && (
            <div className="urlWrapper">
              <div className="url">
                <a href={emailURL}>{emailURL}</a>
              </div>
            </div>
          )}
          {isEmail && isShared && sharedEmails && sharedEmails.length > 0 && (
            <div className="sharedEmailLabelWrapper">
              <span className="sharedEmailLabel">List of currently shared emails:</span>
            </div>
          )}
          {isEmail && (
            <TagInput
              className="emailInput"
              values={emailList}
              placeholder="Add emails seperated by the enter key."
              addOnBlur
              rightElement={(
                <div className="rightContent">
                  <span
                    onClick={() => {
                      this.setState({ emailList: [] });
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    X
                  </span>
                </div>
)}
              addOnPaste
              fill
              onChange={(values: Array<string>) => {
                // Check if any of the tags are not valid email addresses.
                let err = '';
                values.forEach((value) => {
                  if (
                    !value.match(
                      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
                    )
                  ) {
                    err = 'Some of the email addresses listed do not appear to follow normal email formats, these contacts might not recieve a share notification.';
                  }
                });
                this.setState({ error: err });
                this.setState({ emailList: values });
              }}
            />
          )}
          {isEmail && error && <span className="errMsg">{error}</span>}
          {bottomButton}
        </div>
      </Dialog>
    );
  }
}

export default withRouter(ShareDialog);
