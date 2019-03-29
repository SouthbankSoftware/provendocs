/* @flow
 * @Author: Michael Harrison
 * @Date:   2019-01-22T15:48:46+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-01-22T15:50:14+11:00
 */

import React from 'react';
import { TextArea, TagInput, Tooltip } from '@blueprintjs/core';
import { Button } from 'antd';
import InfoIcon from '../../style/icons/pages/dashboard/info-icon.svg';
import ClearIcon from '../../style/icons/pages/dashboard/close-icon.svg';
import { ANTD_BUTTON_TYPES } from '../../common/constants';

type Props = {
  onClickContinue: (comment: string, commentTags: Array<any>) => void;
  onClickCancel: () => void;
  storageLimitReached: boolean;
};
type State = {
  comment: string;
  commentTags: Array<any>;
};

export default class CommentAndTags extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      comment: '',
      commentTags: [],
    };
  }

  render() {
    const { onClickContinue, onClickCancel, storageLimitReached } = this.props;
    const { comment, commentTags } = this.state;

    return (
      <div className="newUploadRHSWrapper comment">
        <div className="centerContent">
          <div className="commentWrapper">
            <div className="header">
              <span>Please place any comments for this upload in the box below.</span>
              <Tooltip content="Any comments and tags will be saved and proven along with all documents in this upload.">
                <InfoIcon className="infoIcon" />
              </Tooltip>
            </div>
            <div className="commentBox">
              <TextArea
                className="commentInput"
                placeHolder="Write your upload comment here (maximum length 500 character)"
                value={comment}
                onChange={(newText: Object) => {
                  if (newText.length < 500) {
                    this.setState({ comment: newText.target.value });
                  } else {
                    this.setState({ comment: newText.target.value.substr(0, 500) });
                  }
                }}
              />
              <div className="charLimit">
                <span>
                  {comment.length}
                  /500
                </span>
              </div>
              <TagInput
                className="commentTagInput"
                values={commentTags}
                placeholder="Write your tags here seperated by the enter key"
                addOnBlur
                rightElement={(
                  <div className="rightContent">
                    <span
                      onClick={() => {
                        this.setState({ commentTags: [] });
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <ClearIcon className="forgetIcon" />
                    </span>
                  </div>
)}
                addOnPaste
                fill
                onChange={(values: Array<string>) => {
                  // You can only have 5 tags at a time.
                  if (values.length <= 5) {
                    this.setState({ commentTags: values });
                  }
                }}
              />
              <div className="tagNumber">
                <span>
                  {commentTags.length}
                  /5
                </span>
              </div>
            </div>
          </div>
        </div>
        {storageLimitReached && (
          <div className="errorMsg">
            Storage limit has been reached, please remove some files to continue.
          </div>
        )}
        <div className="footerButtons">
          <div className="buttons">
            <Button
              text="Cancel"
              type={ANTD_BUTTON_TYPES.DANGER}
              className="cancelButton blueButton"
              onClick={onClickCancel}
            >
              Cancel
            </Button>
            <Button
              text="Upload"
              disabled={storageLimitReached}
              className="continueButton whiteButton"
              type={ANTD_BUTTON_TYPES.PRIMARY}
              onClick={() => {
                onClickContinue(comment, commentTags);
              }}
            >
              Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
