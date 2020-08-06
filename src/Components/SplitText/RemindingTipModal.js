import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

import "./MyModals.css";

const RemindingTipModal = props => {
  //   let [show, setShow] = useState(false);

  //   const pageMapping = [pairProgrammingVideoBody, introductionAndGuidelines];

  const { show, changeShowRemindingTip, tipMessage } = props;

  return (
    <Modal
      size="lg"
      show={show}
      onHide={() => changeShowRemindingTip(false)}
      scrollable={true}
      className="my-modal-container"
    >
      <Modal.Header closeButton>
        <Modal.Title>A fruitful tip </Modal.Title>
      </Modal.Header>
      <Modal.Body>{tipMessage}</Modal.Body>
    </Modal>
  );
};
export default RemindingTipModal;
