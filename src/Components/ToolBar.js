import React from "react";
import LoadButton from "./LoadButton";
import ToggleButton from "./ToggleButton";
import { Navbar, Button, ListGroup } from "react-bootstrap";
import { Menu } from "@material-ui/icons";
import { Drawer } from "@material-ui/core";

import CopyButton from "./CopyButton";

import "./CSS/ToolBar.css";

class ToolBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      drawerOpen: false
    };

    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleIDChange = this.handleIDChange.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    //this.handleRun = this.handleRun.bind(this);
  }

  handleTextChange(e) {
    this.props.handleTextChange(e);
  }

  handleIDChange(e) {
    this.props.handleIDChange(e);
  }

  handleToggle() {
    this.props.handleToggle();
  }

  sendMessage(e) {
  	this.props.onSendMessage(e);
  }

  toggleDrawer = open => {
    this.setState({ drawerOpen: open });
  };

  render() {
    return (
      <Navbar
        variant="light"
        bg={this.props.isPilot ? "primary" : "warning"}
        className="top-bar"
        style={this.props.isPilot ? {color: 'white', fontSize: '1.5em'} : {fontSize : '1.5em'}}
      >
        <Button variant="light" onClick={() => this.toggleDrawer(true)}>
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
        </Drawer>

        <ToggleButton
          onToggle={this.handleToggle}
          userNumber={this.props.userNumber}
          userID = {this.props.userID}
          isPilot={this.props.isPilot}
          sendMessage={this.sendMessage}
        />
        {/* <LoadButton
          //component to reload session from session ID
          onTextChange={this.handleTextChange}
          onSessionIDChange={this.handleIDChange}
        /> */}
        <CopyButton
          //component to save session to backend
          text={this.props.text}
          history={this.props.history}
          sessionID={this.props.sessionID}
          onSessionIDChange={this.handleIDChange}
        />
      </Navbar>
    );
  }
}

export default ToolBar;
