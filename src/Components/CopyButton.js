import React from "react";
import axios from "axios";
import { Button, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ENDPOINT } from "./endpoints";

class CopyButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      copyMsg: false
    };
  }

  handleClick = e => {
    //Generates copy of current page and saves it to dynamoDB

    let data = { text: this.props.text };
    const url = ENDPOINT + "setData";
    this.setState({ copyMsg: true });
    axios.post(url, data).then(
      response => {
        let newSession = "/" + response.data.id;
        window.open("/#" + newSession);
        this.addFork(response.data.id)
        // this.props.onSessionIDChange(response.data.id);
        // this.props.history.push(newSession); //navigate to page referencing copy
      },
      error => {
        console.log(error);
      }
    );
  };

  addFork = child => {

    console.log(this.props.sessionID, child);

    const userURL = ENDPOINT + "updateChildren/" + this.props.sessionID;

        let sessionID = this.state.sessionID;
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


  render() {
    return (
      <div>
        <OverlayTrigger
          trigger={["hover", "focus"]}
          overlay={
            <Tooltip>This will make a copy of this project. (It will open in a new tab)</Tooltip>
          }
          placement="bottom"
        >
          <Button className="copy-btn" type="button" variant="light" onClick={this.handleClick}>
            Fork
          </Button>
        </OverlayTrigger>
        {/* <Modal
          size="md"
          show={this.state.copyMsg}
          onHide={() => this.setState({ copyMsg: false })}
        >
          <Modal.Header >
            <Modal.Title>Created a copy of this session! You are now in the new session.</Modal.Title>
          </Modal.Header>
        </Modal> */}
      </div>
    );
  }
}

export default CopyButton;
