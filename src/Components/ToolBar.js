import React from "react";
import { Navbar, Button, ListGroup } from "react-bootstrap";
import { Menu, SwapHoriz} from "@material-ui/icons";
import { Drawer } from "@material-ui/core";

import { AmplifySignOut } from "@aws-amplify/ui-react";

import CopyButton from "./CopyButton";

import "./CSS/ToolBar.css";


/////     props:
/////     isPilot
/////     userID
/////     sessionID
/////     text
/////     userNumber
/////     history
/////     packageMessage
/////     handleIDChange
/////     userArray
///
class ToolBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      //used for the hamburger menu
      drawerOpen: false
    };

  }

  ///// for the hamburger menu
  toggleDrawer = open => {
    this.setState({ drawerOpen: open });
  };

  /////     handles the actual toggling for the pilot -> copilot
  handleToggleClick = (e) => {
    e.preventDefault()
    if (this.props.isPilot) {
      this.props.pilotHandoff()
    }
  }

  /////     handles the toggling for copilot -> pilot
  requestToggle = (e) => {
    e.preventDefault();
    if (!this.props.isPilot) {
      this.props.packageMessage(this.state, "toggleRequest")
    }
  }

  render() {
    return (
      <Navbar
        variant="light"
        bg={this.props.isPilot ? "primary" : "warning"}
        className="top-bar"
        style={
          this.props.isPilot
            ? { color: "white", fontSize: "1.5em" }
            : { fontSize: "1.5em" }
        }
      >
        {/* Hamburger Menu



         */}
        {/* <Button variant="light" onClick={() => this.toggleDrawer(true)}>
          <Menu />
        </Button>
        <Drawer
          anchor="left"
          open={this.state.drawerOpen}
          onClose={() => this.toggleDrawer(false)}
        >
          <ListGroup variant="flush">
            <ListGroup.Item>Profile</ListGroup.Item>
            <ListGroup.Item>Pair Programming Tips</ListGroup.Item>
          </ListGroup>
        </Drawer> */}
        <CopyButton
          //component to save session to backend
          text={this.props.text}
          history={this.props.history}
          sessionID={this.props.sessionID}
          onSessionIDChange={this.props.handleIDChange}
        />

        {this.props.isPilot ? (
          <label>
            {" "}
            Role: Pilot{" "}
            <Button
              className="swap-button"
              variant="warning"
              type="button"
              onClick={this.handleToggleClick}
              disabled={this.props.userArray.length <= 1}
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
        <AmplifySignOut />
      </Navbar>
    );
  }
}

export default ToolBar;
