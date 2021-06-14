import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { EmojiObjectsRounded } from "@material-ui/icons";

import "./MyModals.css";
import confusionButtonPNG from "../../resources/confusion_button.png";
import chatButtonPNG from "../../resources/chat_button.png";

/**
 * It's the intro pop up that welcomes the user to a new session. 
 * It is used by splittext. 
 */



const introductionAndGuidelines = () => {
  return (
    <h4>
      <EmojiObjectsRounded fontSize="large" />
      The goal of Pair Programming is to help your partner to understand all of
      the code{" "}
    </h4>
  );
};

const pointOutChat = () => {
  return (
    <h4>
      <EmojiObjectsRounded fontSize="large" />
      Use the chat feature <img alt="chat button" height="50" src={chatButtonPNG} /> to talk to
      your partner
      <br/>
      You'll know when they've joined through the "people" icon at the top right. 
    </h4>
  );
};

const pointOutConfusion = () => {
  return (
    <h4>
      <EmojiObjectsRounded fontSize="large" />
      If you have a question, use the question feature{" "}
      <img height="50" alt="question button" src={confusionButtonPNG} /> to let your partner know
    </h4>
  );
};

const FirstTimerModal = props => {
  //initial page is 0
  let [pageNumber, setPageNumber] = useState(0);

  const pageMapping = [
    introductionAndGuidelines,
    pointOutChat,
    pointOutConfusion
  ];

  const { show, changeFirstTimerModalState } = props;

  return (
    <Modal
      size="xl"
      show={show}
      onHide={() => {
          changeFirstTimerModalState(false);
          const timer = setTimeout(() => {
              setPageNumber(0);
              clearTimeout(timer);
          }, 500);
    }}
      scrollable={true}
      className="my-modal-container"
    >
      <Modal.Header closeButton>
        <Modal.Title>How to PearProgram</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="iframe-container">{pageMapping[pageNumber]()}</div>
      </Modal.Body>
      <Modal.Footer className="my-modal-footer">
        {pageNumber > 0 && (
          <Button variant="dark" onClick={() => setPageNumber(pageNumber - 1)}>
            Back
          </Button>
        )}
        {pageNumber === pageMapping.length - 1 ? (
          <Button
            variant="dark"
            onClick={() => changeFirstTimerModalState(false)}
          >
            Ok, got it!
          </Button>
        ) : (
          <Button
            className={pageNumber === 0 ? "first-next-button" : ""}
            onClick={() => {
              console.log(pageNumber);
              setPageNumber(pageNumber + 1);
            }}
          >
            Next
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
export default FirstTimerModal;
