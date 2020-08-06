import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { EmojiObjectsRounded } from "@material-ui/icons";

import "./MyModals.css";
import confusionButtonPNG from "../../resources/confusion_button.png";
import chatButtonPNG from "../../resources/chat_button.png";

const pairProgrammingVideoBody = () => {
  return (
    <iframe
      width="100%"
      height={window.innerHeight * 0.7}
      src="https://www.youtube.com/embed/q7d_JtyCq1A?start=19"
      frameBorder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
};

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
      Use the chat feature <img height="50" src={chatButtonPNG} /> to talk to
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
      <img height="50" src={confusionButtonPNG} /> to let your partner know
    </h4>
  );
};

const FirstTimerModal = props => {
  //initial page is 0
  let [pageNumber, setPageNumber] = useState(0);

  const pageMapping = [
    pairProgrammingVideoBody,
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
