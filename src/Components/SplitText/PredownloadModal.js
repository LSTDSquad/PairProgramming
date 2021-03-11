import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

import "./MyModals.css";

/**
 * This file was made for CS bridge originally - before downloading, the user has to fill out a form. 
 * Used by splittext.
 * Currently unused. 
 */

const endSurveyBody = () => {
  return (
    <div className="iframe-container">
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLScakCr22MNhfORl2fa2Z3_S0euVI4iuDJkp4jjEYt3xSmViYg/viewform?embedded=true"
        width="100%"
        height="500"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
      >
        Loading…
      </iframe>
    </div>
  );
};

const confirmBody = () => {
  return (
    <div>
      <br />
      <h4>Are you sure you submitted the form?</h4>
      <p>Make sure you got the message "your response has been recorded" on the previous page.</p>
      <br />
    </div>
  );
};

const PredownloadModal = props => {
  let [pageNumber, setPageNumber] = useState(0);

  const { show, handleDownloadChange, handleFinishDownload } = props;

  const pageMapping = [endSurveyBody, confirmBody];

  return (
    <Modal size="lg" show={show} onHide={() => handleDownloadChange(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          Share your experience with us to finish downloading
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pageMapping[pageNumber]()}
        {/* <Form onSubmit={this.handleFinishDownload}>
              <Form.Group controlId="formBasicCheckbox">
                <Form.Check type="checkbox" label="I have filled out and clicked 'submit' on the form" />
              </Form.Group> */}
        <Modal.Footer className="my-modal-footer">
          {pageNumber > 0 && (
            <Button
              variant="dark"
              onClick={() => setPageNumber(pageNumber - 1)}
            >
              Back
            </Button>
          )}
          {pageNumber === pageMapping.length - 1 ? (
            <Button
              variant="light"
              type="submit"
              onClick={handleFinishDownload}
              className="finish-modal-button"
            >
              I have submitted the form...now finish downloading!
            </Button>
          ) : (
            <Button
              className={pageNumber === 0 ? "first-next-button" : ""}
              onClick={() => setPageNumber(pageNumber + 1)}
            >
              Next
            </Button>
          )}
        </Modal.Footer>

        {/* </Form> */}
      </Modal.Body>
    </Modal>
  );
};
export default PredownloadModal;
