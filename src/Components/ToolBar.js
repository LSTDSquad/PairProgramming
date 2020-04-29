import React from "react";
import {
  Navbar,
  Button,
  Popover,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import { SwapHoriz, GetApp, EmojiObjectsRounded } from "@material-ui/icons";
// import { Drawer } from "@material-ui/core";

import { AmplifySignOut } from "@aws-amplify/ui-react";

import CopyButton from "./CopyButton";

import "./CSS/ToolBar.css";
import HoverClickPopover from "./HoverClickPopover";

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
  handleToggleClick = e => {
    e.preventDefault();
    if (this.props.isPilot) {
      this.props.pilotHandoff();
    }
  };

  /////     handles the toggling for copilot -> pilot
  requestToggle = e => {
    e.preventDefault();
    if (!this.props.isPilot) {
      this.props.packageMessage(this.state, "toggleRequest");
    }
  };

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
        <div className="left-side-toolbar">
          <HoverClickPopover
            popover={({ ...props }) => (
              <Popover {...props}>
                <Popover.Title>Pair programming tips</Popover.Title>
                <Popover.Content>
                  <div>Talk frequently... communication is key!</div>
                  <div>There's no such thing as a silly question</div>
                  <div>Be supportive of one another</div>
                  <div>Acknowledge that learning how to code is hard!</div>
                </Popover.Content>
              </Popover>
            )}
            variant={this.props.isPilot ? "outline-light" : "outline-dark"}
            buttonClass="tips-button"
            hoverContent={<div>Pair programming tips</div>}
            buttonContent={<EmojiObjectsRounded fontSize="large" />}
            placement="bottom"
          />

          <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={<Tooltip>Download .py file</Tooltip>}
            placement="bottom"
          >
            <Button
              onClick={this.props.handleDownload}
              variant={this.props.isPilot ? "outline-light" : "outline-dark"}
              className="save-button"
            >
              <GetApp fontSize="large" />
            </Button>
          </OverlayTrigger>
        </div>
              <div>
        {this.props.isPilot ? (
          <HoverClickPopover
            popover={({ ...props }) => (
              <Popover {...props}>
                <Popover.Title>What does a Pilot do?</Popover.Title>
                <Popover.Content>
                  <div>Write the code!</div>
                  <div>Think out loud</div>
                  <div>Help the Co-Pilot understand your code</div>
                </Popover.Content>
              </Popover>
            )}
            variant="primary"
            buttonClass=""
            hoverContent={<div>Click for tips</div>}
            buttonContent={<div className="role-display">Role: Pilot </div>}
          />
        ) : (
          // <label>

          //   <OverlayTrigger
          //     trigger={["hover", "focus"]}
          //     overlay={<Tooltip>Click to change roles</Tooltip>}
          //     placement="bottom"
          //   >
          //   <Button
          //     className="swap-button"
          //     variant="warning"
          //     type="button"
          //     onClick={this.handleToggleClick}
          //     disabled={this.props.userArray.length <= 1}
          //   >
          //     <SwapHoriz />
          //   </Button></OverlayTrigger>
          // </label>
          <HoverClickPopover
            popover={({ ...props }) => (
              <Popover {...props}>
                <Popover.Title>What does a Co-Pilot do?</Popover.Title>
                <Popover.Content>
                  <div>Check the Pilot's code for errors</div>
                  <div>Ask clarifying questions</div>
                  <div>Help the Pilot think through the code</div>
                </Popover.Content>
              </Popover>
            )}
            variant="warning"
            buttonClass=""
            hoverContent={<div>Click for tips</div>}
            buttonContent={<div className="role-display">Role: Co-Pilot </div>}
          />
          // <OverlayTrigger
          //   trigger={["hover", "focus"]}
          //   overlay={<Tooltip>Click to change roles</Tooltip>}
          //   placement="bottom"
          // >
          //   <Button
          //     className="swap-button"
          //     variant="primary"
          //     type="button"
          //     onClick={this.requestToggle}
          //   >
          //     <SwapHoriz />
          //   </Button>
          // </OverlayTrigger>
        )}
        <label>
          <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={<Tooltip>Click to change roles</Tooltip>}
            placement="bottom"
          >
            <Button
              className="swap-button"
              variant={this.props.isPilot ? "warning" : "primary"}
              type="button"
              onClick={this.props.isPilot ? this.handleToggleClick : this.requestToggle}
              disabled={this.props.userArray.length <= 1}
            >
              <SwapHoriz />
            </Button>
          </OverlayTrigger>
        </label>
              </div>
        <div className="right-side-toolbar">
          <CopyButton
            //component to save session to backend
            text={this.props.text}
            history={this.props.history}
            sessionID={this.props.sessionID}
            onSessionIDChange={this.props.handleIDChange}
          />
          <AmplifySignOut />
        </div>
      </Navbar>
    );
  }
}

export default ToolBar;
