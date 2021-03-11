import React, { useState } from "react";
import axios from "axios";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ENDPOINT } from "../../endpoints";


/**
 * 
 * @param {*} props 
 *  contains text, sesionID, onSessionIDChange
 * example: 
*  <CopyButton
    //component to save session to backend
    text={this.props.text}
    sessionID={this.props.sessionID}
    onSessionIDChange={this.props.handleIDChange} //not currenly being used? 
  />
 */
function CopyButton({ editorRef, sessionID, onSessionIDChange }) {

  let [_, setCopyMsg] = useState(false);
  /**
   * 
   * @param {string id} child 
   * updates the children relationship to this current session 
   */
  const addFork = child => {
    const userURL = ENDPOINT + "updateChildren/" + sessionID;
    let data = { child: child };
    axios.put(userURL, data).then(
      response => {
        const message = response.data;
        console.log(message);
      },
      error => {
        console.log(error);
      }
    );
  }

  const handleClick = _ => {
    //Generates copy of current page and saves it to the db 
    //saves in the session table in the db
    let data = { text: editorRef.current.editor.getValue()};
    const url = ENDPOINT + "setData";
    setCopyMsg(true);
    axios.post(url, data).then(
      response => {
        let newSession = "/" + response.data.id;
        window.open("/#" + newSession);
        addFork(response.data.id)
      },
      error => {
        console.log(error);
      }
    );
  };

  return (
    <div>
      <OverlayTrigger
        trigger={["hover", "focus"]}
        overlay={
          <Tooltip>This will make a copy of this project. (It will open in a new tab)</Tooltip>
        }
        placement="bottom"
      >
        <Button className="copy-btn" type="button" variant="light" onClick={handleClick}>
          Fork
          </Button>
      </OverlayTrigger>
    </div>
  );

}

export default CopyButton;
