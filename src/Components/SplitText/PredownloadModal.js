import React from "react";
import { Button, Modal } from "react-bootstrap";

const PredownloadModal = props => {
//   let [showDownloadForm, setShowDownloadForm] = useState(false);

  const { show, handleDownloadChange, handleFinishDownload } = props;

  return (
      <Modal
          show={show}
          onHide={() => handleDownloadChange(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Share your experience with us to finish downloading
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
            {/* <Form onSubmit={this.handleFinishDownload}>
              <Form.Group controlId="formBasicCheckbox">
                <Form.Check type="checkbox" label="I have filled out and clicked 'submit' on the form" />
              </Form.Group> */}
            <Button
              variant="light"
              type="submit"
              onClick={handleFinishDownload}
            >
              I have submitted the form...now finish downloading!
            </Button>
            {/* </Form> */}
          </Modal.Body>
        </Modal>
  );
};
export default PredownloadModal;
