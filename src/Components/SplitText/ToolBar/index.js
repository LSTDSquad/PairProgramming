import React from "react";
import {
  Navbar,
  Form,
  Button,
  Popover,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import { Auth } from "aws-amplify";
import {
  HomeRounded,
  SwapHoriz,
  GetApp,
  EmojiObjectsRounded,
  Add,
  HelpOutlineRounded
} from "@material-ui/icons";
// import { Drawer } from "@material-ui/core";
import axios from "axios";
import { ENDPOINT } from "../../endpoints";
import { Link } from "react-router-dom";
import CopyButton from "./CopyButton";
import TeammateCount from "./TeammateCount";
import "./ToolBar.css";
import HoverClickPopover from "../../HoverClickPopover";

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
/////     changeShowFirstTimerModal
///
class ToolBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      //used for the hamburger menu
      drawerOpen: false,
      fileName: this.props.title,
      user: null, //from aws auth
    };
  }

  componentDidMount () {
    //get the name of the user
    Auth.currentAuthenticatedUser()
      .then(user => {
        this.setState(
          {
            user: user
          }
        );
      })
      .catch(err => console.log(err));
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

  //change file name
  handleNameChange = e => {
    this.setState({ fileName: e.target.value }, () => {
      //This needs to be reworked a little
      //GoogleDocs makes it seem much smoother!
      let data = { name: this.state.fileName };
      let sessionID = this.props.sessionID;

      const url = ENDPOINT + "updateName/" + sessionID;

      console.log(url, data);

      axios.put(url, data).then(
        response => {
          const message = response.data;
          console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    });
  };

  //when use clicks away from filename input
  moveAway = () => {
    if (this.state.fileName === "") {
      this.setState({ fileName: "untitled document" });
    }
  };

  //goodle docs style where the whole name highlights if the title is "untitled document"
  handleRenameClick = e => {
    e.preventDefault();
    console.log(e.target.value);
    if (this.state.fileName === "untitled document") {
      e.target.select();
    }
  };

  makeNewSession = e => {
    e.preventDefault();
    const url = ENDPOINT + "setData";
    let data = { text: "# happy coding!" };
    axios.post(url, data).then(
      response => {
        let newSession = "/" + response.data.id;
        this.props.handleIDChange(response.data.id);
        this.props.history.push(newSession); //navigate to page referencing copy
        // const lastEditurl = ENDPOINT + "updateLastEdit/" + response.data
        // data = {timestamp: String(new Date())};
        // axios.post(lastEditurl, data).then( response => {
        //   console.log(response);
        window.location.reload(true);
        // })
      },
      error => {
        console.log(error);
      }
    );
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
          <Link to="/">
            <Button className="home-button">
              <HomeRounded fontSize="large" />
            </Button>
          </Link>
          <Form onSubmit={e => e.preventDefault()}>
            <Form.Control
              type="text"
              value={this.state.fileName}
              onChange={this.handleNameChange}
              onClick={this.handleRenameClick}
              onBlur={this.moveAway}
            />
          </Form>
          <HoverClickPopover
            popover={({ ...props }) => (
              <Popover {...props}>
                <Popover.Title>Pair programming tips</Popover.Title>
                <Popover.Content>
                  <div>Remember to switch roles often!</div>
                  <div>The goal is for both partners to understand all of the code!</div>
                  <div>Learning to code is hard! Help each other when you are stuck</div>
                  <div>Be supportive and respectful</div>
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
          {/* <Button onClick={this.props.handleInterrupt} className="copy-btn" type="button" variant="light" id="interrupt-button">Stop Code</Button> */}
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
              buttonContent={
                <div className="role-display">Role: Co-Pilot </div>
              }
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
                onClick={
                  this.props.isPilot
                    ? this.handleToggleClick
                    : this.requestToggle
                }
                disabled={this.props.userArray.length <= 1}
              >
                <SwapHoriz />
              </Button>
            </OverlayTrigger>
          </label>
        </div>
        <div className="right-side-toolbar">
          <TeammateCount userArray={this.props.userArray} />
          {/* CREATING NEW SESSION */}
          {/* <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={<Tooltip>Create a new session</Tooltip>}
            placement="bottom"
          >
            <Button
              onClick={this.makeNewSession}
              className="bg-light text-dark"
            >
              <Add />
            </Button>
          </OverlayTrigger> */}
          <CopyButton
            //component to save session to backend
            text={this.props.text}
            // history={this.props.history}
            sessionID={this.props.sessionID}
            onSessionIDChange={this.props.handleIDChange}
          />
          {/* LOGGING OUT */}
          {/* <Button
            className="m-2 bg-dark"
            onClick={() => {
              this.state.user.signOut();
              window.location.reload(true);
            }}
          >
            Log out
          </Button> */}
          <Button 
            variant={this.props.isPilot ? "primary" : "warning"}
            onClick={() => this.props.changeShowFirstTimerModal(true)}
            >
            <HelpOutlineRounded className="toolbar-icon">

            </HelpOutlineRounded>
          </Button>
        </div>
      </Navbar>
    );
  }
}

export default ToolBar;
