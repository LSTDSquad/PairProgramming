import React from "react";
import SplitPane from "react-split-pane";
import TextOutput from "./TextOutput";
import TextInput from "./TextInput";
import ToolBar from "./ToolBar";
import PubNub from "pubnub";
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
import { Switch, FormControlLabel } from "@material-ui/core";

import { ENDPOINT } from "./endpoints";

class SplitText extends React.Component {
  constructor(props) {
    super(props);
    //used for splitPane, i think. (textOutput)
    this.outputRef = React.createRef();

    //BINDINGS
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.runCode = this.runCode.bind(this);
    this.addToast = this.addToast.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.pilotHandoff = this.pilotHandoff.bind(this);
    const userID = Math.round(Math.random() * 1000000).toString();
    
    this.state = {
      text: "print(3+5)",
      sessionID: this.props.match.params.sessionID, //new session will default to 'unsaved' as the session ID
      userID,
      //these two items operate like dictionaries key: userID, value: cursor/highlight coordinates
      cursors: {},
      selections: {},
      isPilot: true,
      userArray: [{id: userID}], //in format: [{id, name}...]
      lines: [""],
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
      state: [], //we are no longer using this?
      presenceTimeout: 20
    });

    let currentComponent = this;
    //add PubNub listener to handle messages
    this.PubNub.addListener({
      message: ({ channel, message }) => {
        // console.log(message);
        if (message.Type === "join" && message.Who !== this.state.userID) {
          console.log(message.Who, "joining");
          //notify everyone besides the person who joined
          let userArr = this.state.userArray;
          userArr.push({id: message.Who, name: message.UserName})
          //send out the actual updated new queue
          this.setState({userArray: userArr});
          this.packageMessage(userArr, "userArray"); //to tell the person who just joined what the userARray is 
        } else if (message.Type === "userArray") {
          console.log(message.What, "user Array");
          //after the first person joins, they will get this package 
          this.setState({userArray: message.What}, () => this.assignRole());
        } else if (message.Type === "leave" && message.Who !== this.state.userID) {
          console.log(message.Who, "leaving");
          let userArr = this.state.userArray;
          const i = userArr.map(user => user.id).indexOf(message.Who);
          if (i !== -1) {
            userArr.splice(i, 1);
          }
          this.setState({userArray: userArr}, () => this.assignRole());
          delete this.state.cursors[message.Who];
        }
        else if ((message.Type === "cursor") && (message.Who !== this.state.userID)) {
          //if message containing cursor change info comes in, update cursor object in setState
          console.log("cursor message", "curr user", this.state.userID, "origin:", message.Who)
          let what = { msg: message.What, name: message.UserName };
          this.setState({
            ...(this.state.cursors[message.Who] = what)
          });
        } else if (
          (message.Type === "text") &
          (message.Who != this.state.userID)
        ) {
          this.setState({ text: message.What });
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
          (this.state.isPilot)
        ) {
          this.toggleAlert(message.Who, message.UserName);
        }
      }
    });

    //subscribe to channel based on sessionID
    this.PubNub.subscribe({
      channels: [this.state.sessionID],
      withPresence: true
    });
  }

  toggleAlert = (id, name) => {
    //function to bypass Chrome blocking alerts on background windows

    confirmAlert({
      title: "Toggle Role Request",
      message: name + " requests pilot role",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            //swap id and current
            let userArr = this.state.userArray;
            const requester = userArr.map(user => user.id).indexOf(id);
            userArr[0] = {id, name};
            userArr[requester] = {id: this.state.userID, name: this.state.user_name};
            this.setState({ isPilot: false, userArray: userArr}, () => this.packageMessage(this.state.userArray, "userArray"));

            let sessionID = this.state.sessionID;
            if (this.props.path != "/") {
              //if this session exists already, update the entry in dynamoDB
              const url1 = ENDPOINT + "updateToggleCount/" + sessionID;

              let data = { timeStamp: String(new Date()) };

              axios.put(url1, data).then(
                response => {
                  const message = response.data;
                  console.log(message);
                },
                error => {
                  console.log(error);
                }
              );
            }
          }
        },
        { label: "No", onClick: () => console.log("remain") }
      ]
    });
  };

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

    if(type == "codeOutput" ||
       type == "confused" ||
       type == "resolve" ||
       type == "toggleRequest"){

      const url = ENDPOINT + "updateTimeStamps/" + this.state.sessionID;
      let who = this.state.user_name
      let data = { event: String(new Date()),who, type };
      console.log(1, data);


      axios.put(url, data).then(
        response => {
          const message = response.data;
          console.log(message);
        },
        error => {
          console.log(error);
        }
      );

    }

    //send cursor/selection message on sessionID channel
    this.PubNub.publish(
      { channel: this.state.sessionID, message: messageObj },
      function(status, response) {
      }
    );
  }

  unsubscribeChannel = () => {
    this.packageMessage("", "leave");
    this.PubNub.unsubscribeAll();
  }

  //////                                       //////
  //////     Skulpt functions to run python    //////
  //////                                       //////

  outf = text => {
    var arr = [];
    arr.push(text);
    if (/\S/.test(text)) {
      this.setState(
        prevState => ({
          lines: [...prevState.lines, text]
        }),
        () => this.packageMessage(this.state.lines, "codeOutput")
      );
    }
  };

  /////   runCode handles using the current text in state
  /////            and running it as python code
  runCode() {
    const builtinRead = x => {
      if (
        Sk.builtinFiles === undefined ||
        Sk.builtinFiles["files"][x] === undefined
      )
        throw "File not found: '" + x + "'";
      return Sk.builtinFiles["files"][x];
    };

    var input = this.state.text;
    this.setState(prevState => ({
      lines: [...prevState.lines, "pair-programming-session:~ $ run"]
    }));
    Sk.configure({
      output: this.outf,
      read: builtinRead,
      inputfun: function(prompt) {
        return window.prompt(prompt, "");
      },
      inputfunTakesPrompt: true
    });

    try {
      Sk.importMainWithBody("<stdin>", false, input, true);
    } catch (e) {
      this.setState(
        prevState => ({
          lines: [...prevState.lines, e.toString()]
        }),
        () => this.packageMessage(this.state.lines, "codeOutput")
      );
    }

    let sessionID = this.state.sessionID;
    if (this.props.path != "/") {
      //if this session exists already, update the entry in dynamoDB
      const url = ENDPOINT + "updateRunCount/" + sessionID;

      let data = { timeStamp: String(new Date()) };

      axios.put(url, data).then(
        response => {
          const message = response.data;
          console.log(message);
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

    //in case someone is trying to view on their phone.
    if (window.matchMedia("(max-width: 767px)").matches) {
      this.setState({ onMobile: true });
    }
    if (this.props.match.path != "/") {
      //must be a valid session
      let session = this.props.match.params.sessionID;
      console.log("session", session);
      const url = ENDPOINT + "getData/" + session;
      var self = this;

      axios.get(url).then(function(response) {
        self.handleTextChange(response.data);
      });

      this.setState({ sessionID: session });
      this.handleSessionIDChange(session);
    }

    //get the name of the user
    Auth.currentAuthenticatedUser()
      .then(user => {
        this.setState({ user_name: user.attributes.name, userArray: [{id: this.state.userID, name: user.attributes.name}] }, () => 
        //announce to everyone that you've joined! 
        this.packageMessage("", "join"))
        
      })
      .catch(err => console.log(err));
  }

  /////       for both input and output panes
  /////         updates the state
  handleTextChange = text => {
    this.setState({ text });
  };

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
    });
  }


  //from pilot to copilot
  pilotHandoff() {
    //swap with the second one 
    let userArr = this.state.userArray;
    userArr[0] = userArr[1];
    userArr[1] = {id: this.state.userID, name: this.state.user_name}

    this.setState({userArray: userArr}, () => this.packageMessage(userArr, "userArray"))

    const url = ENDPOINT + "updateTimeStamps/" + this.state.sessionID;

      let type = "pilotHandoff"
      let who = this.state.user_name
      let data = { event: String(new Date()),who, type };

      axios.put(url, data).then(
        response => {
          const message = response.data;
          console.log(message);
        },
        error => {
          console.log(error);
        }
      );

    let sessionID = this.state.sessionID;
    if (this.props.path != "/") {
      //if this session exists already, update the entry in dynamoDB
      const url1 = ENDPOINT + "updateToggleCount/" + sessionID;

      let data = { timeStamp: String(new Date()) };

      axios.put(url1, data).then(
        response => {
          const message = response.data;
          console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }


  }

  assignRole = () => {
    //assign role based on userArray
    if (this.state.userArray.map(user => user.id).indexOf(this.state.userID) === 0) {
      this.setState({ isPilot: true });
    } else {
      this.setState({ isPilot: false });
    }
  };

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
    // this.setTimeout(3000);
    this.packageMessage("", "leave");
    this.unsubscribeChannel();
    window.removeEventListener("beforeunload", this.unsubscribeChannel);
  }

  render() {
    const {
      text,
      sessionID,
      userID,
      cursors,
      selections,
      isPilot,
      lines: codeOutput,
      confusionStatus,
      resolve
    } = this.state;
    const history = this.props.history;

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
              userArray={this.state.userArray}
              history={history}
              packageMessage={this.packageMessage}
              handleIDChange={this.handleSessionIDChange}
              pilotHandoff={this.pilotHandoff}
              // handleToggle={this.toggleRole}
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
                onTextChange={this.handleTextChange}
                sessionID={sessionID}
                userID={userID}
                confusionStatus={confusionStatus}
                resolve={resolve}
                cursors={cursors}
                selections={selections}
                handleRun={this.runCode}
                addToast={this.addToast}
                user_name={this.state.user_name}
                packageMessage={this.packageMessage}
              />
              <TextOutput
                side="right"
                ref={this.outputRef}
                text={codeOutput}
                onTextChange={this.handleTextChange}
                userID={userID}
              />
            </SplitPane>
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
