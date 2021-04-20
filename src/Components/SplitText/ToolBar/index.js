import React, { useEffect, useState } from "react";
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
  HelpOutlineRounded
} from "@material-ui/icons";
import axios from "axios";
import { apiPutCall, ENDPOINT } from "../../endpoints";
import { Link } from "react-router-dom";
import CopyButton from "./CopyButton";
import TeammateCount from "./TeammateCount";
import "./ToolBar.css";
import HoverClickPopover from "../../HoverClickPopover";

/**
 * example use:
 *  <ToolBar
      isPilot={isPilot}
      userID={userID}
      sessionID={sessionID}
      text={text}
      userArray={this.state.userArray}
      history={history}
      userName={this.props.attributes.name}
      packageMessage={this.packageMessage}
      handleIDChange={this.handleSessionIDChange}\
      setPilot={this.setPilot}
      handleDownload={this.handleDownload}
      title={this.state.fileName}
      changeShowFirstTimerModal={this.changeShowFirstTimerModal}
    />
 */
function ToolBar({ isPilot, userID, sessionID, editorRef, onlineUsers, history,
  userName, packageMessage, handleIDChange, fetchPilot, setPilot, handleDownload,
  title, changeShowFirstTimerModal }) {
  //used for the hamburger menu
  let [drawerOpen, setDrawerOpen] = useState(false);
  let [fileName, setFileName] = useState(title);
  let [user, setUser] = useState(null); //from aws auth

  useEffect(() => {
    if (user === null) {
      Auth.currentAuthenticatedUser()
        .then(userID => setUser(userID))
        .catch(err => {});
    }
  });

  ///// for the hamburger menu
  const toggleDrawer = open => {
    setDrawerOpen(open);
  };

  /////     handles the actual toggling for the pilot -> copilot
  const handleToggleClick = e => {
    e.preventDefault();
    if (isPilot) {
      //the next random one
      const newPilot = Object.entries(onlineUsers).find((user) => user[0] !== userID);
      //newPilot is like [uuid, userName]
      setPilot(newPilot[0]);

      let type = "pilotHandoff";
      let who = userName;
      let data = { event: String(new Date()), who, type };
      apiPutCall("updateTimeStamps/" + sessionID, data);

      //if this session exists already, update the entry in dynamoDB
      apiPutCall("updateToggleCount/" + sessionID, { timeStamp: String(new Date()) });
    };

  };

  /////     handles the toggling for copilot -> pilot
  const requestToggle = e => {
    e.preventDefault();
    if (!isPilot) {
      fetchPilot((pilotID) => {
        //directed to pilotID
        packageMessage(pilotID, "toggleRequest");
      })
    }
  };

  //change file name
  const handleNameChange = e => {
    const fname = e.target.value;
    setFileName(fname);

    //This needs to be reworked a little
    //GoogleDocs makes it seem much smoother!
    let data = { name: fname };
    const url = ENDPOINT + "updateName/" + sessionID;
    axios.put(url, data).then(
      response => {
      },
      error => {
        console.log(error);
      }
    );
  };

  //when user clicks away from filename input
  const moveAway = () => {
    if (fileName === "") {
      setFileName("Untitled document");
    }
  };

  //goodle docs style where the whole name highlights if the title is "untitled document"
  const handleRenameClick = e => {
    e.preventDefault();
    if (fileName === "untitled document") {
      e.target.select();
    }
  };

  //not currently used because there is no new sessino button in toolbar /
  // const makeNewSession = e => {
  //   e.preventDefault();
  //   const url = ENDPOINT + "setData";
  //   let data = { text: "# happy coding!" };
  //   axios.post(url, data).then(
  //     response => {
  //       let newSession = "/" + response.data.id;
  //       handleIDChange(response.data.id);
  //       history.push(newSession); //navigate to page referencing copy
  //       // const lastEditurl = ENDPOINT + "updateLastEdit/" + response.data
  //       // data = {timestamp: String(new Date())};
  //       // axios.post(lastEditurl, data).then( response => {
  //       //   console.log(response);
  //       window.location.reload(true);
  //       // })
  //     },
  //     error => {
  //       console.log(error);
  //     }
  //   );
  // };

  return (
    <Navbar
      variant="light"
      bg={isPilot ? "primary" : "warning"}
      className="top-bar"
      style={
        isPilot
          ? { color: "white", fontSize: "1.5em" }
          : { fontSize: "1.5em" }
      }
    >
      {/* Hamburger Menu. experimental 
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
            value={fileName}
            onChange={handleNameChange}
            onClick={handleRenameClick}
            onBlur={moveAway}
          />
        </Form>
        <HoverClickPopover
          // this props is for HoverClickPopover
          popover={(props) => (
            <Popover {...props}>
              <Popover.Title>Pair programming tips</Popover.Title>
              <Popover.Content>
                <div>Remember to switch roles often!</div>
                <div>The goal is for both partners to understand all of the code!</div>
                <div>Learning to code is hard! Help each other when you are stuck</div>
                <div>Be supportive and respectful</div>
              </Popover.Content>
            </Popover >

          )}
          variant={isPilot ? "outline-light" : "outline-dark"}
          buttonClass="tips-button"
          hoverContent={<div>Pair programming tips</div>}
          buttonContent={<EmojiObjectsRounded fontSize="large" id="pair-programming-tips" />}
          placement="bottom"
        />

        <OverlayTrigger
          trigger={["hover", "focus"]}
          overlay={<Tooltip>Download .py file</Tooltip>}
          placement="bottom"
        >
          <Button
            onClick={handleDownload}
            variant={isPilot ? "outline-light" : "outline-dark"}
            className="save-button"
          >
            <GetApp fontSize="large" />
          </Button>
        </OverlayTrigger>
      </div>
      <div>
        {isPilot ? (
          <HoverClickPopover
            popover={(props) => (
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

          <HoverClickPopover
            popover={(props) => (
              <Popover {...props}>
                <Popover.Title>What does a Co-Pilot do?</Popover.Title>
                <Popover.Content>
                  <div>Check the Pilot's code for errors</div>
                  <div>Ask clarifying questions</div>
                  <div>Help the Pilot think through the code</div>
                </Popover.Content>
              </Popover>
            )}
            variant=""
            buttonClass="co-pilot-role-btn"
            hoverContent={<div>Click for tips</div>}
            buttonContent={
              <div className="role-display">Role: Co-Pilot </div>
            }
          />

        )}
        <label>
          <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={<Tooltip>Click to change roles</Tooltip>}
            placement="bottom"
          >
            <Button
              className={isPilot ? "co-pilot-role-btn swap-button" : "swap-button"}
              variant={isPilot ? "" : "primary"}
              type="button"
              onClick={
                isPilot
                  ? handleToggleClick
                  : requestToggle
              }
              disabled={Object.keys(onlineUsers).length <= 1}
            >
              <SwapHoriz />
            </Button>
          </OverlayTrigger>
        </label>
      </div>
      <div className="right-side-toolbar">
        <TeammateCount userArray={Object.entries(onlineUsers)} />
        {/* CREATING NEW SESSION */}
        {/* <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={<Tooltip>Create a new session</Tooltip>}
            placement="bottom"
          >
            <Button
              onClick={makeNewSession}
              className="bg-light text-dark"
            >
              <Add />
            </Button>
          </OverlayTrigger> */}
        <CopyButton
          //component to save session to backend
          editorRef={editorRef}
          sessionID={sessionID}
          onSessionIDChange={handleIDChange}
        />
        {/* LOGGING OUT */}
        {/* <Button
            className="m-2 bg-dark"
            onClick={() => {
              user.signOut();
              window.location.reload(true);
            }}
          >
            Log out
          </Button> */}
        {/* <Button
          variant={isPilot ? "primary" : ""}
          className={isPilot ? "" : "help-button-copilot"}
          onClick={() => changeShowFirstTimerModal(true)}
        >
          <HelpOutlineRounded className="toolbar-icon">
          </HelpOutlineRounded>
        </Button> */}
      </div>
    </Navbar>
  );
}

export default ToolBar;