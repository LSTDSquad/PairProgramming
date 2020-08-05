import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

import "./MyModals.css";

const RemindingTipModal = props => {
  //   let [show, setShow] = useState(false);

  //   const pageMapping = [pairProgrammingVideoBody, introductionAndGuidelines];

  const { show, changeShowRemindingTip, tipMessage } = props;

  return show ? (
    <Modal
      size="sm"
      show={show}
      onHide={() => changeShowRemindingTip(false)}
      scrollable={true}
      className="my-modal-container"
    >
      <Modal.Header closeButton>
        <Modal.Title>Don't forget to....</Modal.Title>
      </Modal.Header>
      <Modal.Body>{tipMessage}</Modal.Body>
    </Modal>
  ) : (
    <div />
  );
};
export default RemindingTipModal;
