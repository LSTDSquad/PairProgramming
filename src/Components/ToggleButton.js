import React from "react";
import { Button } from "react-bootstrap";
import { SwapHoriz } from "@material-ui/icons";
import "./CSS/ToggleButton.css";

class ToggleButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      drawerOpen: false
    };

    this.handleClick = this.handleClick.bind(this);
    this.requestToggle = this.requestToggle.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
  }

  handleClick(e) {
    e.preventDefault()
    if (this.props.isPilot) {
      this.props.onToggle();
      this.packageMessage("pilotHandoff", "pilotHandoff")
    }
  }

  packageMessage(what, type) {
    //package either cursor or selection change into message
    //object and send it in SplitText.js sendMessage function
    const messageObj = {
      Who: this.props.userID,
      Type: type,
      What: what,
      When: new Date().valueOf()
    };

    this.props.sendMessage(messageObj);
  }

  requestToggle(e) {
    e.preventDefault();
    if (!this.props.isPilot) {
      this.packageMessage(this.state, "toggleRequest")
      //this.props.onToggle();
    }
  }

  render() {
    return (
      <div>
        {this.props.isPilot ? (
          <label>
            {" "}
            Role: Pilot{" "}
            <Button
              className="swap-button"
              variant="warning"
              type="button"
              onClick={this.handleClick}
            >
              <SwapHoriz />
            </Button>
          </label>
        ) : (
          <label>
            Role: Copilot{" "}
            <Button
              className="swap-button"
              variant="primary"
              type="button"
              onClick={this.requestToggle}
            >
              <SwapHoriz />
            </Button>
          </label>
        )}
      </div>
    );
  }
}

export default ToggleButton;
