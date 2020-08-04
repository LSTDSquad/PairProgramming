import React from "react";
import SplitPane from "react-split-pane";
import TextOutput from "./TextOutput/";
import TextInput from "./TextInput/";
import ToolBar from "./ToolBar/";
import Loading from "../Loading/";
import PredownloadModal from "./PredownloadModal";
import FirstTimerModal from "./FirstTimerModal";
import PubNub from "pubnub";
import axios from "axios";
import Sk from "skulpt";
import "skulpt/dist/skulpt.min.js";
import "skulpt/dist/skulpt-stdlib.js";
import "./SplitText.css";
import MyToast from "./MyToast";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Auth } from "aws-amplify";
import {
  Widget,
  addResponseMessage,
  renderCustomComponent
} from "react-chat-widget";
import "react-chat-widget/lib/styles.css";
import "./ReactChatWidget.css";

import { Form, Button, Modal, Container, Row, Toast } from "react-bootstrap";
import { Switch, FormControlLabel } from "@material-ui/core";

import { ENDPOINT } from "../endpoints";

const MAX_TOGGLE_WAIT = 10000; //10 seconds is the max amount of time before toggle gets handed over to copilot

class SplitText extends React.Component {
  constructor(props) {
    super(props);
    //used for splitPane, i think. (textOutput)
    this.outputRef = React.createRef();
    this.inputRef = React.createRef();

    //BINDINGS
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.runCode = this.runCode.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.addToast = this.addToast.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.pilotHandoff = this.pilotHandoff.bind(this);
    this.basicSetState = this.basicSetState.bind(this);
    this.handleDownloadChange = this.handleDownloadChange.bind(this);
    this.changeFirstTimerModalState = this.changeFirstTimerModalState.bind(this);
    const userID = Math.round(Math.random() * 1000000).toString();

    this.state = {
      textLoaded: false,
      startTime: String(),
      titleLoaded: false,
      text: "# happy coding!",
      sessionID: this.props.match.params.sessionID, //new session will default to 'unsaved' as the session ID
      userID, //NOTE THAT THIS IS ONLY FOR PUBNUB PURPOSES. THIS IS NOT THAT SPECIFIC USER'S UNIQUE IDENTIFIER
      //these two items operate like dictionaries key: userID, value: cursor/highlight coordinates
      cursors: {},
      selections: {},
      isPilot: true,
      userArray: [{ id: userID }], //in format: [{id, name}...]
      lines: [
        "Welcome to PearProgram! This is your console. Click the run button to see your output here."
      ],
      toasts: [],
      confusionStatus: {},
      resolve: {},
      seeToasts: true,
      onMobile: false,
      user_name: "",
      showCopilotToggleMsg: false,
      msRemaining: MAX_TOGGLE_WAIT,
      fileName: "",
      waitingForInput: false,
      showDownloadForm: false,
      isFirstSessionEver: false,
    };

    this.baseState = this.state;
    this.toggleTimer = null;

    //this allows us to "open files"
    Sk.inBrowser = true;

    //not working
    // Sk.externalLibraries = {
    //   doctest: {
    //     path: 'https://raw.githubusercontent.com/python/cpython/master/Lib/doctest.py',
    //     dependencies: [],
    //   }
    // }
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

    this.MessageAuthor = ({ author }) => (
      <div className="author-message">{author}</div>
    );

    //add PubNub listener to handle messages
    this.PubNub.addListener({
      message: ({ channel, message }) => {
        if (message.Type === "join" && message.Who !== this.state.userID) {
          console.log(message.Who, "joining");
          //notify everyone besides the person who joined
          let userArr = this.state.userArray;
          userArr.push({ id: message.Who, name: message.UserName });
          //send out the actual updated new queue
          this.setState({ userArray: userArr });
          this.packageMessage(userArr, "userArray"); //to tell the person who just joined what the userARray is
        } else if (message.Type === "userArray") {
          // console.log(message.What, "user Array");
          //after the first person joins, they will get this package
          //this could also be used whenever someone else updates the user array.
          this.setState({ userArray: message.What }, () => this.assignRole());
        } else if (
          message.Type === "leave" &&
          message.Who !== this.state.userID
        ) {
          // console.log(message.Who, "leaving");
          let userArr = this.state.userArray;
          const i = userArr.map(user => user.id).indexOf(message.Who);
          if (i !== -1) {
            userArr.splice(i, 1);
          }
          this.setState({ userArray: userArr }, () => this.assignRole());
          delete this.state.cursors[message.Who];
        } else if (
          message.Type === "cursor" &&
          message.Who !== this.state.userID
        ) {
          //if message containing cursor change info comes in, update cursor object in setState
          // console.log(
          //   "cursor message",
          //   "curr user",
          //   this.state.userID,
          //   "origin:",
          //   message.Who
          // );
          let what = { msg: message.What, name: message.UserName };
          this.setState({
            ...(this.state.cursors[message.Who] = what)
          });
        } else if (
          (message.Type === "chat") &
          (message.Who !== this.state.userID)
        ) {
          //this is what lets you know who send the message
          renderCustomComponent(
            this.MessageAuthor,
            { author: message.UserName },
            false
          );
          //this function is what allows partner's messages to be seen
          addResponseMessage(`${message.What}`);
        } else if (
          (message.Type === "text") &
          (message.Who !== this.state.userID)
        ) {
          this.setState({ text: message.What });
        } else if (
          (message.Type === "selection") &
          (message.Who !== this.state.userID)
        ) {
          //if message containing highlight change info comes in, update selection object in state
          let what = { msg: message.What, name: message.UserName };
          this.setState({
            ...(this.state.selections[message.Who] = what)
          });
        } else if (
          (message.Type === "codeOutput") &
          (message.Who !== this.state.userID)
        ) {
          // console.log(message.What);
          this.setState({ lines: message.What });
        } else if (
          (message.Type === "comment") &
          (message.Who !== this.state.userID)
        ) {
          //I'm not sure if this is good form to call
          //child functions from parent?
          this.inputRef.current.recieveComment(message.What);
        } else if (
          (message.Type === "confused") &
          (message.Who !== this.state.userID)
        ) {
          this.setState({ confusionStatus: message.What });
        } else if (
          (message.Type === "resolve") &
          (message.Who !== this.state.userID)
        ) {
          this.setState({ resolve: message.What });
        } else if (message.Type === "toggleRequest") {
          if ((message.Who !== this.state.userID) & this.state.isPilot) {
            this.toggleAlert(message.Who, message.UserName);
          } else if (message.Who === this.state.userID) {
            //it is the current user
            this.setState({ showCopilotToggleMsg: true });

            this.toggleTimer = setInterval(() => {
              if (this.state.msRemaining > 0) {
                this.setState({ msRemaining: this.state.msRemaining - 1000 });
              } else {
                this.setState({
                  showCopilotToggleMsg: false
                });
                let timer;
                timer = setTimeout(() => {
                  this.setState({ msRemaining: MAX_TOGGLE_WAIT });
                  clearTimeout(timer);
                }, 300);
              }
            }, 1000);
          }
        } else if (message.Type === "toggleResponse") {
          if ((message.What === "decline") & this.state.showCopilotToggleMsg) {
            clearInterval(this.toggleTimer);
            this.setState({
              showCopilotToggleMsg: false
            });
            let timer;
            timer = setTimeout(() => {
              this.setState({ msRemaining: MAX_TOGGLE_WAIT });
              clearTimeout(timer);
            }, 300);
          }
        }
      }
    });

    //subscribe to channel based on sessionID
    this.PubNub.subscribe({
      channels: [this.state.sessionID],
      withPresence: true
    });
  }

  componentDidMount() {
    window.addEventListener("beforeunload", event => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";

      this.unsubscribeChannel();
    });

    this.setState({ startTime: String(new Date()) });

    //in case someone is trying to view on their phone.
    if (window.matchMedia("(max-width: 767px)").matches) {
      this.setState({ onMobile: true });
    }
    let session = this.props.match.params.sessionID;
    if (this.props.match.path !== "/") {
      //must be a valid session
      // console.log("session", session);
      const url = ENDPOINT + "getData/" + session;
      var self = this;

      axios.get(url).then(function(response) {
        self.handleTextChange(response.data);
        self.setState({ textLoaded: true });
      });

      this.setState({ sessionID: session });
      this.handleSessionIDChange(session);

      const nameurl = ENDPOINT + "getName/" + session;

      //to load file name if it exists
      axios
        .get(nameurl)
        .then(function(response) {
          // console.log(response.data);

          if (response.data === undefined) {
            self.setState({ fileName: "untitled document" });
          } else {
            self.setState({ fileName: response.data }, () => {});
          }
          self.setState({ titleLoaded: true });
        })
        .catch(function(error) {
          self.setState({ titleLoaded: true });
          // handle error
        });
    }

    //get the name of the user
    Auth.currentAuthenticatedUser()
      .then(user => {
        // console.log(user);
        this.setState(
          {
            user_name: user.attributes.name,
            userArray: [{ id: this.state.userID, name: user.attributes.name }]
          },
          () => {
            //announce to everyone that you've joined!
            this.packageMessage("", "join");
          }
        );

        const getSessionsUrl =
          ENDPOINT + "getSessions/" + user.attributes.email;
        axios.get(getSessionsUrl).then(
          response => {
            if (response.data.length > 0) {
              //change to be opposite later
              this.setState({ isFirstSessionEver: true });
            }
            //now, update the sessions
            const userURL =
              ENDPOINT + "updateSessions/" + user.attributes.email;

            let sessionID = this.state.sessionID;
            let data = { session: sessionID };

            axios.put(userURL, data).then(
              response => {
                const message = response.data;
                // console.log(message);
              },
              error => {
                console.log(error);
              }
            );
          },
          error => {
            console.error(error);
          }
        );
      })
      .catch(err => console.log(err));
  }

  togglePilot = (id, name) => {
    let userArr = this.state.userArray;
    const requester = userArr.map(user => user.id).indexOf(id);
    userArr[0] = { id, name };
    userArr[requester] = { id: this.state.userID, name: this.state.user_name };
    this.setState({ isPilot: false, userArray: userArr }, () =>
      this.packageMessage(this.state.userArray, "userArray")
    );

    let sessionID = this.state.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const url1 = ENDPOINT + "updateToggleCount/" + sessionID;

      let data = { timeStamp: String(new Date()) };

      axios.put(url1, data).then(
        response => {
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }
  };

  toggleAlert = (id, name) => {
    //function to bypass Chrome blocking alerts on background windows

    let currentComponent = this;

    var toggleTimeout = setTimeout(function() {
      currentComponent.togglePilot(id, name);

      confirmAlert({
        title: "Pilot Time Out",
        message: "You timed out and are now co-pilot",
        buttons: [{ label: "Ok" }]
      });
    }, MAX_TOGGLE_WAIT); //10 second timeout for no pilot response

    confirmAlert({
      title: "Toggle Role Request",
      message: name + " requests pilot role",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            //swap id and current

            clearTimeout(toggleTimeout);
            this.togglePilot(id, name);
          }
        },
        {
          label: "No",
          onClick: () => {
            clearTimeout(toggleTimeout);
            console.log("remain");
            this.packageMessage("decline", "toggleResponse");
          }
        }
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

    if (
      type === "codeOutput" ||
      type === "confused" ||
      type === "resolve" ||
      type === "comment" ||
      type === "toggleRequest" ||
      type === "chat"
    ) {
      const url = ENDPOINT + "updateTimeStamps/" + this.state.sessionID;
      let who = this.state.user_name;
      let data = { event: String(new Date()), who, type };
      // console.log(1, data);

      axios.put(url, data).then(
        response => {
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }

    //send cursor/selection message on sessionID channel
    this.PubNub.publish(
      { channel: this.state.sessionID, message: messageObj },
      function(status, response) {}
    );
  }

  putSessionLength = async () => {
    const url = ENDPOINT + "updateSessionLength/" + this.state.sessionID;

    let who = this.state.user_name;
    let data = { start: this.state.startTime, end: String(new Date()), who };

    axios.put(url, data).then(
      response => {
        const message = response.data;
        console.log(message);
      },
      error => {
        console.log(error);
      }
    );
  };

  unsubscribeChannel = () => {
    this.packageMessage("", "leave");
    this.PubNub.unsubscribeAll();

    console.log("calling...");
    const done = this.putSessionLength();
    console.log(done);
  };

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
      ) {
        throw "File not found: '" + x + "'";
      }
      return Sk.builtinFiles["files"][x];
    };

    var input = this.state.text;
    this.setState(prevState => ({
      lines: [...prevState.lines, "pair-programming-session:~ $ run"]
    }));
    var self = this;
    Sk.configure({
      output: this.outf,
      read: builtinRead,
      inputfun: function(prompt) {
        self.setState(prevState => ({
          lines: [...prevState.lines, prompt],
          waitingForInput: true
        }));
        document.getElementById("std-input").focus();
        return new Promise(function(resolve, reject) {
          document.getElementById("std-input").onkeyup = e => {
            if (e.keyCode === 13) {
              //add input to lines
              self.setState(
                prevState => ({
                  lines: [...prevState.lines, `> ${e.target.value}`],
                  waitingForInput: false
                }),
                () => resolve(e.target.value)
              );
              //clear the input
            }
          };
        });
        // var interval = setInterval(function() {
        //   if (self.state.inputEntered) {
        //     console.log(self.state.inputEntered);
        //     clearInterval(interval)
        //     return self.state.inputEntered;
        //   }
        // }, 500);
        // // return window.prompt(prompt, "");
      },
      inputfunTakesPrompt: true
    });

    try {
      Sk.misceval
        .asyncToPromise(function() {
          return Sk.importMainWithBody("<stdin>", false, input, true);
        })
        .then(() =>
          self.setState(
            prevState => ({
              lines: [
                ...prevState.lines,
                "<<<<<<<<<< Program finished running >>>>>>>>>>"
              ]
            }),
            () => self.packageMessage(self.state.lines, "codeOutput")
          )
        )
        //when there's a compile or runtime error
        .catch(e =>
          self.setState(
            prevState => ({
              lines: [
                ...prevState.lines,
                e.toString(),
                "<<<<<<<<<< Program finished running >>>>>>>>>>"
              ]
            }),
            () => self.packageMessage(this.state.lines, "codeOutput")
          )
        );
    } catch (e) {
      console.log(e);
      self.setState(
        prevState => ({
          lines: [
            ...prevState.lines,
            e.toString(),
            "<<<<<<<<<< Program finished running >>>>>>>>>>"
          ]
        }),
        () => self.packageMessage(this.state.lines, "codeOutput")
      );
    }

    let sessionID = this.state.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const url = ENDPOINT + "updateRunCount/" + sessionID;

      let data = { timeStamp: String(new Date()) };

      axios.put(url, data).then(
        response => {
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  handleDownload = () => {
    this.setState({ showDownloadForm: true });
  };

  handleFinishDownload = () => {
    this.setState({ showDownloadForm: false });
    const element = document.createElement("a");
    const file = new Blob([this.state.text], { type: "text/x-python" });
    element.href = URL.createObjectURL(file);
    element.download = "pearprogram.py";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  //////                                                    //////
  //////   Functions that handle state changes/updates      //////
  //////                                                    //////

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
    userArr[1] = { id: this.state.userID, name: this.state.user_name };

    this.setState({ userArray: userArr }, () =>
      this.packageMessage(userArr, "userArray")
    );

    const url = ENDPOINT + "updateTimeStamps/" + this.state.sessionID;

    let type = "pilotHandoff";
    let who = this.state.user_name;
    let data = { event: String(new Date()), who, type };

    axios.put(url, data).then(
      response => {
        const message = response.data;
        // console.log(message);
      },
      error => {
        console.log(error);
      }
    );

    let sessionID = this.state.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const url1 = ENDPOINT + "updateToggleCount/" + sessionID;

      let data = { timeStamp: String(new Date()) };

      axios.put(url1, data).then(
        response => {
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  assignRole = () => {
    //assign role based on userArray
    if (
      this.state.userArray.map(user => user.id).indexOf(this.state.userID) === 0
    ) {
      this.setState({ isPilot: true });
      if (this.state.showCopilotToggleMsg) {
        clearInterval(this.toggleTimer);
        this.setState({
          showCopilotToggleMsg: false,
          msRemaining: MAX_TOGGLE_WAIT
        });
      }
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

  basicSetState = stateChange => this.setState(stateChange);

  ////                              ////
  ////      Chat Stuff              ////
  ////                              ////

  handleNewUserMessage = newMessage => {
    // console.log(`New message incoming! ${newMessage}`);

    const url = ENDPOINT + "updateChat/" + this.state.sessionID;
    let who = this.state.user_name;
    let data = { message: String(new Date()), who, newMessage };
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

    // package chat text and send through PubNub
    this.packageMessage(newMessage, "chat");
  };

  handleDownloadChange(newValue) {
    this.setState({ showDownloadForm: newValue });
  }

  changeFirstTimerModalState(newValue) {
    this.setState({isFirstSessionEver: newValue})
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
    ) : this.state.textLoaded && this.state.titleLoaded ? (
      <div>
        <PredownloadModal
          show={this.state.showDownloadForm}
          handleDownloadChange={this.handleDownloadChange}
          handleFinishDownload={this.handleFinishDownload}
        />
        <FirstTimerModal 
          show={this.state.isFirstSessionEver}
          changeFirstTimerModalState={this.changeFirstTimerModalState}
          />
        {/* <Modal
          show={this.state.showDownloadForm}
          onHide={() => this.setState({ showDownloadForm: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Share your experience with us to finish downloading
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="iframe-container">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLScakCr22MNhfORl2fa2Z3_S0euVI4iuDJkp4jjEYt3xSmViYg/viewform?embedded=true"
                width="100%"
                height="500"
                frameborder="0"
                marginheight="0"
                marginwidth="0"
              >
                Loading…
              </iframe>
            </div>

            <Button
              variant="light"
              type="submit"
              onClick={this.handleFinishDownload}
            >
              I have submitted the form...now finish downloading!
            </Button>
          </Modal.Body>
        </Modal> */}
        <Widget
          handleNewUserMessage={this.handleNewUserMessage}
          title="Teammate Chat"
          subtitle=""
        />
        <Container fluid style={{ padding: 0, margin: 0 }}>
          <Row noGutters={true} style={{ justifyContent: "center" }}>
            <Toast
              className="copilot-toggle-msg"
              show={this.state.showCopilotToggleMsg}
            >
              <Toast.Header closeButton={false}>
                Swap request sent!
              </Toast.Header>
              <Toast.Body>
                If pilot does not respond to request within{" "}
                {this.state.msRemaining / 1000} seconds, you will become pilot.
              </Toast.Body>
            </Toast>
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
              handleDownload={this.handleDownload}
              title={this.state.fileName}
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
                ref={this.inputRef}
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
                waitingForInput={this.state.waitingForInput}
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
                      )}
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
        <div id="hello.txt" style={{ display: "none" }}>{`hello\nworld\n`}</div>
      </div>
    ) : (
      <Loading />
    );
  }
}

export default SplitText;
