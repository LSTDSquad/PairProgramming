import React from "react";
import {  Modal } from "react-bootstrap";

import "./MyModals.css";

/**
 * RemindingTipModal
 * @param {*} props 
 * Reminds every ~10 min. uses SessionUtilities.js. 
 * Used by CSBridge2020. 
 * Currently unused.
 * 
 */

const RemindingTipModal = props => {

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
