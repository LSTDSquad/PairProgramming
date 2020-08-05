import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

import "./MyModals.css";

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
    <iframe
      width="100%"
      height="600"
      frameBorder="0"
      src="https://docs.google.com/document/d/e/2PACX-1vTyfkipq9maxBADkQEUA_QSqoG-xBZQFyXE02MbLJeZe9pq2TeETYHnrIONG70AyVCDY2_cM-ZLB0Z7/pub?embedded=true"
    ></iframe>
  );
};

const FirstTimerModal = props => {
  //initial page is 0
  let [pageNumber, setPageNumber] = useState(0);

  const pageMapping = [pairProgrammingVideoBody, introductionAndGuidelines];

  const { show, changeFirstTimerModalState } = props;

  return (
    <Modal
      size="xl"
      show={show}
      onHide={() => changeFirstTimerModalState(false)}
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
