import React from "react";
import SplitPane from "react-split-pane";
import TextOutput from "./TextOutput";
import TextInput from "./TextInput";
import ToolBar from "./ToolBar";
import PubNub from "pubnub";
import { PubNubProvider, usePubNub } from "pubnub-react";
import axios from "axios";
import Sk from "skulpt";
import "skulpt/dist/skulpt.min.js";
import "skulpt/dist/skulpt-stdlib.js";
import "./CSS/SplitText.css";
import MyToast from "./MyToast";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Auth } from "aws-amplify";

import { Container, Row } from "react-bootstrap";
import { HashRouter as Router, Route, Link } from "react-router-dom";
import { Switch, FormControlLabel } from "@material-ui/core";

class SplitText extends React.Component {
  //handles the state for both text boxes
  //state gets managed here (for now?)
  constructor(props) {
    super(props);

    this.handleLeftChange = this.handleLeftChange.bind(this);
    this.handleRightChange = this.handleRightChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.handleCursorChange = this.handleCursorChange.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.toggleRole = this.toggleRole.bind(this);
    this.assignUserNumber = this.assignUserNumber.bind(this);
    this.assignRole = this.assignRole.bind(this);
    this.outputRef = React.createRef();
    this.outf = this.outf.bind(this);
    this.builtinRead = this.builtinRead.bind(this);
    this.runCode = this.runCode.bind(this);
    this.addToast = this.addToast.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.unsubscribeChannel = this.unsubscribeChannel.bind(this);

    this.state = {
      text: "print(3+5)",
      sessionID: this.props.match.params.sessionID, //new session will default to 'unsaved' as the session ID
      userID: Math.round(Math.random() * 1000000).toString(),

      //these two items operate like dictionaries key: userID, value: cursor/highlight coordinates
      cursors: {},
      selections: {},
      isPilot: true,
      userArray: [],
      lines: [""],
      userNumber: Number, //number based on order of subscription to channel,
      toasts: [],
      confusionStatus: {},
      resolve: {},
      seeToasts: true,
      onMobile: false,
      user_name: ""
    };

    this.baseState = this.state;

    //////                                       //////
    //////      Initial Pubnub setup             //////
    //////                                       //////

    this.PubNub = new PubNub({
      subscribe_key: "sub-c-76b1e8e8-6988-11ea-94ed-e20534093ea4",
      publish_key: "pub-c-94dff15e-b743-4157-a74e-c7270627723b",
      uuid: this.state.userID,
      state: [],
      // userArray: [],
      presenceTimeout: 20
    });

    Auth.currentAuthenticatedUser()
      .then(user => this.setState({ user_name: user.attributes.name }))
      .catch(err => console.log(err));

    let currentComponent = this;
    //add PubNub listener to handle messages
    this.PubNub.addListener({
      presence: function(p) {
        console.log("p", p);
        console.log("uuid", p.uuid);

        //allows for dynamic user numbers/toggling depending on when
        //users come and go
        var userNumber = Object;

        if (p.action == "leave" || p.action == "timeout") {
          //if a user leaves or times out, adjust other numbers

          console.log("USER LEFT");
          if (p.state != undefined) {
            console.log(p.state, currentComponent.state.userNumber);
            if (
              (p.state.userNumber === 1 || p.state.userNumber === 0) &
              (currentComponent.state.userNumber === 1 ||
                currentComponent.state.userNumber === 2)
            ) {
              console.log("new pilot");
              userNumber = { userNumber: 1 };
              currentComponent.setState({ userNumber: 1, isPilot: true });
            } else if (
              (p.state.userNumber === 2) &
              (currentComponent.state.userNumber === 3)
            ) {
              userNumber = { userNumber: 2 };
              currentComponent.setState({ userNumber: 2 });
            } else if (
              p.state.userNumber <= currentComponent.state.userNumber
            ) {
              userNumber = {
                userNumber: currentComponent.state.userNumber - 1
              };
              currentComponent.setState({
                userNumber: currentComponent.state.userNumber - 1
              });
            }
          }

          currentComponent.PubNub.setState(
            {
              //sync PubNub state with current user state
              state: userNumber,
              channels: [currentComponent.state.sessionID]
            },
            function(status) {
              // console.log(status);
            }
          );

          const copyCursors = { ...currentComponent.state.cursors };
          delete copyCursors[p.uuid];
          //console.log("cursors",currentComponent.state.cursors,copyCursors)
          currentComponent.setState({ cursors: copyCursors });

          const copySelections = { ...currentComponent.state.selections };
          delete copySelections[p.uuid];
          currentComponent.setState({ selections: copySelections });
        } else if (p.action === "join") {
          //set pubnub state to include usernumber on join
          // console.log('compare', p.state.userNumber, currentComponent.state.userNumber);

          if (p.uuid === currentComponent.state.userID) {
            currentComponent
              .assignUserNumber()
              .then(userNumber => {
                console.log("currUser", userNumber);
                // let newState = p.state;
                // if (newState === undefined) newState = { userArray: [] };
                // if (this.state.userArray.indexOf(p.uuid) !== -1) return;
                // // userNumber = { userNumber: currentComponent.state.userNumber };
                // console.log("user doesn't exist yet");
                // newState.userArray.push(p.uuid);
                // currentComponent.setState({
                //   numUsers: currentComponent.state.numUsers + 1
                // });
                currentComponent.PubNub.setState(
                  {
                    //sync PubNub state with current user state
                    state: userNumber,
                    // userArray: p.userArray,
                    channels: [currentComponent.state.sessionID]
                  },
                  function(status) {
                    // console.log(status);
                    console.log(status);
                    console.log(p.state);
                  }
                );
              })
              .catch(err => console.log(err));
          }
          // let playerList = currentComponent.state.userArray;
          // for (let i = 0; i < p.occupancy; i++) {
          //   if (p.uuid !== undefined) {
          //     var uuidMatchJoin = playerList.indexOf(p.uuid);
          //     console.log(
          //       "UUID ARRAY INDEX: ",
          //       uuidMatchJoin,
          //       "UUID: ",
          //       p.uuid
          //     );
          //     if (uuidMatchJoin === -1) {
          //       playerList[playerList.length] = p.uuid;
          //       console.log("Insert ", p.uuid, "in array");
          //     } else {
          //       console.log("UUID: ", p.uuid, "is already in the array");
          //     }
          //   }
          // }
          // currentComponent.setState({ userArray: playerList });
          // console.log(playerList);
          console.log(p);

          //
        }
      },
      message: ({ channel, message }) => {
        // console.log(message);
        if ((message.Type === "cursor") & (message.Who != this.state.userID)) {
          //if message containing cursor change info comes in, update cursor object in setState
          let what = { msg: message.What, name: message.UserName };
          this.setState({
            ...(this.state.cursors[message.Who] = what)
          });
        } else if (
          (message.Type === "text") &
          (message.Who != this.state.userID)
        ) {
          this.setState({ text: message.What });
          // console.log(this.state.userID, this.state.userNumber);
        } else if (
          (message.Type === "selection") &
          (message.Who != this.state.userID)
        ) {
          //if message containing highlight change info comes in, update selection object in state
          let what = { msg: message.What, name: message.UserName };
          this.setState({
            ...(this.state.selections[message.Who] = what)
          });
        } else if (
          (message.Type === "codeOutput") &
          (message.Who != this.state.userID)
        ) {
          // console.log(message.What);
          this.setState({ lines: message.What });
        } else if (
          (message.Type === "confused") &
          (message.Who != this.state.userID)
        ) {
          this.setState({ confusionStatus: message.What });
        } else if (
          (message.Type === "resolve") &
          (message.Who != this.state.userID)
        ) {
          this.setState({ resolve: message.What });
        } else if (
          (message.Type === "toggleRequest") &
          (message.Who != this.state.userID) &
          (this.state.isPilot === true)
        ) {
          this.toggleAlert(message.Who, message.UserName);
        } else if (
          (message.Type === "pilotHandoff") &
          (message.Who != this.state.userID) &
          (this.state.userNumber === 2)
        ) {
          this.setState({ isPilot: true, userNumber: 1 });

          //sync PubNub state with current user state
          var userNumber = { userNumber: 1 };

          this.PubNub.setState(
            {
              state: userNumber,
              channels: [this.state.sessionID]
            },
            function(status) {
              // console.log(status);
            }
          );
        }
      }
    });

    //subscribe to channel based on sessionID
    this.PubNub.subscribe({
      channels: [this.state.sessionID],
      withPresence: true
    });
  }

  toggleAlert = (who, name) => {
    //function to bypass Chrome blocking alerts on background windows

    let currentComponent = this;
    confirmAlert({
      title: "Toggle Role Request",
      message: name + " requests pilot role",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            // console.log("toggle");
            this.setState({ isPilot: false, userNumber: 2 });
            this.packageMessage(
              [this.state.isPilot, this.state.userNumber],
              "pilotHandoff"
            );

            //sync PubNub state with current user state
            var userNumber = { userNumber: 2 };
            this.PubNub.setState(
              {
                state: userNumber,
                channels: [this.state.sessionID]
              },
              function(status) {
                // console.log(status);
              }
            );
          }
        },
        { label: "No", onClick: () => console.log("remain") }
      ]
    });
  };

  sendMessage(message, type) {
    //send cursor/selection message on sessionID channel
    this.PubNub.publish(
      { channel: this.state.sessionID, message: message },
      function(status, response) {
        //console.log("Publish Result: ", status, message);
      }
    );
  }

  packageMessage(what, type) {
    //package either cursor or selection change into message
    //object and send it in SplitText.js sendMessage function
    const messageObj = {
      Who: this.state.userID,
      UserName: this.state.user_name,
      Type: type,
      What: what,
      When: new Date().valueOf()
    };

    this.sendMessage(messageObj);
  }

  unsubscribeChannel() {
    this.PubNub.unsubscribeAll();
  }

  //////                                       //////
  //////     Skulpt functions to run python    //////
  //////                                       //////

  outf(text) {
    var arr = [];
    arr.push(text);
    if (/\S/.test(text)) {
      //console.log(text);
      this.setState(
        prevState => ({
          lines: [...prevState.lines, text]
        }),
        () => this.packageMessage(this.state.lines, "codeOutput")
      );
    }

    // console.log("codeRan");
  }

  builtinRead(x) {
    if (
      Sk.builtinFiles === undefined ||
      Sk.builtinFiles["files"][x] === undefined
    )
      throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
  }

  runCode() {
    var input = this.state.text;
    this.setState(prevState => ({
      lines: [...prevState.lines, "pair-programming-session:~ $ run"]
    }));
    Sk.configure({
      output: this.outf,
      read: this.builtinRead,
      inputfun: function(prompt) {
        return window.prompt(prompt, "");
      },
      inputfunTakesPrompt: true
    });

    try {
      Sk.importMainWithBody("<stdin>", false, input, true);
    } catch (e) {
      this.setState(prevState => ({
        lines: [...prevState.lines, e.toString()]
      }));
    }

    let sessionID = this.state.sessionID;
    if (this.props.path != "/") {
      //if this session exists already, update the entry in dynamoDB
      const url =
        "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateRunCount/" +
        sessionID;

      let data = { timeStamp: String(new Date()) };
      // console.log(data);

      axios.put(url, data).then(
        response => {
          // console.log(response);
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  //////                                                    //////
  //////   Functions that handle state changes/updates      //////
  //////                                                    //////

  componentDidMount() {
    window.addEventListener("beforeunload", this.unsubscribeChannel);
    // console.log(this.props.match.params.sessionID);

    if (window.matchMedia("(max-width: 767px)").matches) {
      this.setState({ onMobile: true });
    }
    if (this.props.match.path != "/") {
      // console.log(this.props.match.params.sessionID);
      let session = this.props.match.params.sessionID;

      const url =
        "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/getData/" +
        session;
      var self = this;

      axios.get(url).then(function(response) {
        self.handleLeftChange(response.data);
      });

      this.setState({ sessionID: session });
      this.handleSessionIDChange(session);
    }
  }

  componentDidUpdate(prevProps, prevState) {}

  handleLeftChange(text) {
    this.setState({ text });
    // console.log(this.state.userNumber);
  }

  handleRightChange(text) {
    this.setState({ text });
  }

  handleCursorChange(user, cursor) {}

  handleSelectionChange() {}

  handleSessionIDChange(id) {
    //on sessionID change (session was loaded), unsubscribe
    this.PubNub.unsubscribe({ channels: [this.state.sessionID] });

    this.state = this.baseState;

    //clear cursors/highlights from state
    this.setState({ cursors: {}, selections: {} });

    //set the sessionID in state and subscribe to new channel based on sessionID
    this.setState({ sessionID: id }, () => {
      //use callback due to asynchronous nature of .setState
      this.PubNub.subscribe({
        channels: [this.state.sessionID],
        withPresence: true
      });
      this.assignRole();

      let currentComponent = this;
    });
  }

  toggleRole() {
    if (this.state.userNumber === 1) {
      this.setState({ userNumber: 2 });
    }
    this.setState({ isPilot: !this.state.isPilot });

    let sessionID = this.state.sessionID;
    if (this.props.path != "/") {
      //if this session exists already, update the entry in dynamoDB
      const url =
        "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateToggleCount/" +
        sessionID;

      axios.put(url).then(
        response => {
          // console.log(response);
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  assignRole() {
    //assign role based on userNumber
    //only person with number 0 will start as pilot
    // console.log("userNumber", this.state.userNumber);
    // console.log(this.state.userID, this.state.userNumber);

    if (this.state.userNumber === 0) {
      this.setState({ isPilot: true });
    } else {
      this.setState({ isPilot: false });
    }
  }

  assignUserNumber() {
    //assign the window a number based on when they showed up in channel
    //i.e the 7th user to subscribe will get number 7
    let currentComponent = this;

    return new Promise((resolution, rejection) => {
      this.PubNub.hereNow(
        //set this window's userNumber to the current number of users on the channel
        {
          channels: [this.state.sessionID],
          includeUUIDs: true,
          includeState: true
        },
        function(status, response) {
          console.log(response, currentComponent.state.userNumber);
          if (!response) {
            resolution();
          }
          // if (response.totalOccupancy === 0) {
          //for some reason when the first person joins Occupancy shows up as 0
          currentComponent.setState(
            { userNumber: response.totalOccupancy },
            () => currentComponent.assignRole()
          );
          resolution(response.totalOccupancy);
          // console.log("hereNow Response: ", response);
          // console.log(response.channels[currentComponent.state.sessionID]);
          // let playerList = [];
          // for (let i = 0; i < response.totalOccupancy; i++) {
          //   playerList[i] =
          //     response.channels[currentComponent.state.sessionID].occupants[i].uuid;
          // }
          // currentComponent.setState({ userArray: playerList });
          // console.log("hereNow UUIDs: ", playerList);

          // } else {
          //   //otherwise it shows up as the true occupancy
          //   currentComponent.setState(
          //     { userNumber: response.totalOccupancy },
          //     () => currentComponent.assignRole()
          //   );
          // }
        }
      );
    });
  }

  addToast(newToast) {
    this.setState(prevState => ({
      toasts: [...(prevState.toasts || []), newToast]
    }));
  }

  removeToastForNow = index => {
    let currToasts = this.state.toasts;
    currToasts[index].show = false;
    this.setState({ toasts: currToasts });
  };

  componentWillUnmount() {
    //mostly removes users from PubNub channels on browserclose/refresh (not 100% successful)
    this.unsubscribeChannel();
    window.removeEventListener("beforeunload", this.unsubscribeChannel);
  }

  render() {
    const text = this.state.text;
    const sessionID = this.state.sessionID;
    const userID = this.state.userID;
    const cursors = this.state.cursors;
    const selections = this.state.selections;
    const isPilot = this.state.isPilot;
    const userNumber = this.state.userNumber;
    const codeOutput = this.state.lines;
    const history = this.props.history;
    const confusionStatus = this.state.confusionStatus;
    const resolve = this.state.resolve;

    let container = document.getElementById("toasts-container");
    if (container) {
      //delay the scrolling by .1 seconds so that it has time to account for the new toast
      setTimeout(() => (container.scrollTop = container.scrollHeight), 100);
    }

    return this.state.onMobile ? (
      <div>
        Oy! Looks like you're trying to code on a mobile device. Please try
        accessing this programming tool with a tablet or computer.
      </div>
    ) : (
      <div>
        <Container fluid style={{ padding: 0, margin: 0 }}>
          <Row noGutters={true}>
            <ToolBar
              isPilot={isPilot}
              userID={userID}
              sessionID={sessionID}
              text={text}
              userNumber={userNumber}
              history={history}
              onSendMessage={this.sendMessage}
              handleTextChange={this.handleLeftChange}
              handleIDChange={this.handleSessionIDChange}
              handleToggle={this.toggleRole}
              numUsers={this.state.numUsers}
            />
          </Row>
          <Row noGutters={true}>
            <SplitPane
              //One side input, other side output, once we get app to run code?
              split="vertical"
              minSize={500}
              defaultSize={window.innerWidth / 2}
              style={{ bottom: 0, top: 70, height: "auto" }} //window.innerHeight-80}}
              pane2Style={{ overflow: "scroll", backgroundColor: "#292a2e" }}
              resizerStyle={{ border: "5px solid blue" }}
            >
              <TextInput
                side="left"
                text={text}
                ref="input"
                isPilot={isPilot}
                onTextChange={this.handleLeftChange}
                onCursorChange={this.handleCursorChange}
                onSelectionChange={this.handleSelectionChange}
                sessionID={sessionID}
                onSendMessage={this.sendMessage}
                userID={userID}
                confusionStatus={confusionStatus}
                resolve={resolve}
                cursors={cursors}
                selections={selections}
                handleRun={this.runCode}
                addToast={this.addToast}
              />
              <TextOutput
                side="right"
                ref={this.outputRef}
                text={codeOutput}
                onTextChange={this.handleRightChange}
                userID={userID}
              />
            </SplitPane>
            {/* <Button className="chat-btn">Chat</Button> */}
            {this.state.seeToasts && (
              <div className="meta-toast-container">
                <div className="toasts-container" id="toasts-container">
                  {this.state.toasts &&
                    this.state.toasts
                      .slice()
                      .map(
                        (toast, i) =>
                          toast.show && (
                            <MyToast
                              key={i}
                              index={i}
                              removeToastForNow={this.removeToastForNow}
                              toast={toast}
                            />
                          )
                      )
                  // .reverse()
                  }
                </div>
                <div className="fade-toasts" />
              </div>
            )}
            <FormControlLabel
              className="comments-switch-group"
              control={
                <Switch
                  checked={this.state.seeToasts}
                  onChange={() =>
                    this.setState({ seeToasts: !this.state.seeToasts })
                  }
                  classes={{
                    track: "comments-switch-track",
                    thumb: "comments-switch"
                  }}
                />
              }
              label="See past questions"
            />
          </Row>
        </Container>
      </div>
    );
  }
}

export default SplitText;
