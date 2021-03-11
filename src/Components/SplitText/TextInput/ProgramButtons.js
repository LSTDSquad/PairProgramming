/**
 * Program buttons related to program execution, commentary 
 */
import React, { useState} from 'react';
import {
  PlayArrowRounded,
  StopRounded,
  SendRounded,
  CommentRounded,
  HelpOutlineRounded,
  DoneRounded
} from "@material-ui/icons";
import {
  Button,
  OverlayTrigger,
  Tooltip,
  Form,
  Alert,
  Popover
} from "react-bootstrap";
import HoverClickPopover from "../../HoverClickPopover";

/**
 * 
 * @param {isRunningCode: Boolean, handleInterrupt: function, handleRun: function} params 
 * example:
*  <RunOrStopButton handleInterrupt={this.props.handleInterrupt}
          isRunningCode={this.props.isRunningCode}
          handleRun={this.props.handleRun} />
 */
function RunOrStopButton({ isRunningCode, handleInterrupt, handleRun }) {
  let tooltipText, buttonVariant, onClick, icon, id;
  if (isRunningCode) {
    tooltipText = "Stop execution";
    buttonVariant = "danger";
    onClick = handleInterrupt;
    icon = <StopRounded />;
    id = "interrupt-button";
  } else {
    tooltipText = "Run code";
    buttonVariant = "success";
    onClick = handleRun;
    icon = <PlayArrowRounded />;
    id = "run-button";
  }

  return (

    <OverlayTrigger
      trigger={["hover", "focus"]}
      overlay={<Tooltip>{tooltipText}</Tooltip>}
      placement="right"
    >
      <Button
        id={id}
        variant={buttonVariant}
        className="run"
        onClick={onClick}
      >
        {icon}
      </Button>
    </OverlayTrigger>

  );
}

/**
 * 
 * @param {selected: bool, handleConfused: fn, setConfusedMsg} props 
 * example:
 * <ConfusedButton
          selected={this.state.selected}
          announceConfused={this.announceConfused}
        />
 */
function ConfusedButton({ selected, announceConfused }) {
  let [confusedError, setConfusedError] = useState(false);
  let [confusedMsg, setConfusedMsg] = useState("");
  let [showPopover, setShowPopover] = useState(false);

  const handleConfused = event => {
    event.preventDefault();
    if (!/\S/.test(confusedMsg)) {
      //only white space
      setConfusedError(true);
      return;
    }
    setConfusedError(false);
    setShowPopover(false);
    setConfusedMsg("");
    announceConfused(confusedMsg);
  };

  const getConfusedPopover = ({ ...props }) => {
    return (
      <Popover {...props} className="confused-popover">
          <Form onSubmit={handleConfused}>
            <Form.Label>Briefly describe your confusion.</Form.Label>
            {confusedError && (
              <Alert variant="danger">Please enter a note.</Alert>
            )}
            <div className="confused-input">
              <Form.Control
                onChange={event => {
                  setConfusedMsg(event.target.value);
                }}
                size="md"
                type="text"
              ></Form.Control>
              <Button variant="primary" type="submit">
                <SendRounded />
              </Button>
            </div>
          </Form>
      </Popover>
    );
  };
  return (
    <HoverClickPopover
      onHidePopover={() => {
        setConfusedMsg("");
        setShowPopover(false);
      }}
      popover={getConfusedPopover}
      variant="danger"
      buttonClass="confused-btn"
      showPopover={showPopover} //to close the confused popover once submitted.
      hoverContent={
        <div>Click to ask your partner a question about the code</div>
      }
      onClick={() => setShowPopover(true)}
      buttonContent={<HelpOutlineRounded />}
      usePopoverStateOutside={true}
    />
  );
}

/**
 * 
 * @param {selected: bool, announceComment: fn} 
 * example:
 * <CommentButton
          announceComment={this.announceComment} />
 */
function CommentButton({ announceComment }) {
  let [commentMsg, setCommentMsg] = useState("");
  let [showCommentPopover, setShowCommentPopover] = useState("");
  let [commentError, setCommentError] = useState(false);

  const handleComment = event => {
    event.preventDefault();
    if (!/\S/.test(commentMsg)) {
      //only white space
      setCommentError(true);
      return;
    }
    setCommentError(false);
    setShowCommentPopover(false);
    setCommentMsg("");
    announceComment(commentMsg);
  };

  const getCommentPopover = ({ ...props }) => (
    <Popover {...props} className="confused-popover">
   
        <Form onSubmit={handleComment}>
          <Form.Label>Enter your comment:</Form.Label>
          {commentError && (
            <Alert variant="danger">Please enter a comment.</Alert>
          )}
          <div className="comment-input">
            <Form.Control
              onChange={e => setCommentMsg(e.target.value)}
              size="md"
              type="text"
            // placeholder="briefly describe your confusion."
            ></Form.Control>
            <Button variant="primary" type="submit">
              <SendRounded />
            </Button>
          </div>
        </Form>
    </Popover>
  );

  return (
    <HoverClickPopover
      onHidePopover={() => {
        setCommentMsg("")
        setShowCommentPopover(false);
      }}
      popover={getCommentPopover}
      variant="warning"
      buttonClass="comment-btn"
      showPopover={showCommentPopover} //to close the comment popover once submitted.
      hoverContent={<div>Click to make a public comment on the code</div>}
      onClick={() => {
        setShowCommentPopover(true);
      }}
      buttonContent={<CommentRounded />}
      usePopoverStateOutside={true}
    />
  );
}

function ResolveButton({ handleResolve }) {
  return (<OverlayTrigger
    trigger={["hover", "focus"]}
    overlay={<Tooltip>Resolve the question</Tooltip>}
    placement="right"
    >
    <Button
      variant="success"
      className="resolve-btn"
      onClick={handleResolve}
    >
      <DoneRounded />
    </Button>
  </OverlayTrigger>
  )
}

export { RunOrStopButton, CommentButton, ConfusedButton, ResolveButton };