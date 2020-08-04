import React from "react";
import { Button, Modal } from "react-bootstrap";

const PredownloadModal = props => {
  //   let [showDownloadForm, setShowDownloadForm] = useState(false);

  const { show, changeFirstTimerModalState } = props;

  return (
    <Modal
      size="xl"
      show={show}
      onHide={() => changeFirstTimerModalState(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Welcome to your first session!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="iframe-container">
          <iframe
            width="100%"
            height="600"
            frameborder="0"
            src="https://docs.google.com/document/d/e/2PACX-1vQHLb35Va8gyIQH3RLhlCKJHz94jfNlPtZx13LPmaul3UJYzgE5Om7HJ0g1hgnlMeSRVMy68NEOMUfh/pub?embedded=true"
          ></iframe>
        </div>
        {/* <Form onSubmit={this.handleFinishDownload}>
              <Form.Group controlId="formBasicCheckbox">
                <Form.Check type="checkbox" label="I have filled out and clicked 'submit' on the form" />
              </Form.Group> */}
        <Button
          variant="dark"
          type="submit"
          onClick={() => changeFirstTimerModalState(false)}
        >
          Ok, got it!
        </Button>
        {/* </Form> */}
      </Modal.Body>
    </Modal>
  );
};
export default PredownloadModal;
