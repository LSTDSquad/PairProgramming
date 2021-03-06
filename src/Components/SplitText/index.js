import React from "react";
import SplitPane from "react-split-pane";
import TextOutput from "./TextOutput/";
import TextInput from "./TextInput/";
import ToolBar from "./ToolBar/";
import Loading from "../Loading/";
import PubNub from "pubnub";
import axios from "axios";
import Sk from "skulpt";
import "skulpt/dist/skulpt.min.js";
import "skulpt/dist/skulpt-stdlib.js";
import "./SplitText.css";
import MyToast from "./MyToast";
import {
  Widget,
  addResponseMessage,
  renderCustomComponent
} from "react-chat-widget";
import "react-chat-widget/lib/styles.css";
import "./ReactChatWidget.css";
import { isMobile } from 'react-device-detect';
import { Container, Row, Toast } from "react-bootstrap";
import { Switch, FormControlLabel } from "@material-ui/core";

import { apiGetCall, apiPutCall, ENDPOINT } from "../endpoints";

const MAX_TOGGLE_WAIT = 10000; //10 seconds is the max amount of time before toggle gets handed over to copilot

/**
 * props: 
 * name, userSignature
 */
class SplitText extends React.Component {
  constructor(props) {
    super(props);
    this.codeText = React.createRef();
    //BINDINGS
    this.setEditorRef = this.setEditorRef.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.runCode = this.runCode.bind(this);
    this.addToast = this.addToast.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.basicSetState = this.basicSetState.bind(this);
    this.updatePresences = this.updatePresences.bind(this);
    this.setCodeText = this.setCodeText.bind(this);
    const userID = PubNub.generateUUID();

    this.state = {
      textLoaded: false,
      startTime: String(),
      titleLoaded: false,
      text: "",
      sessionID: this.props.match.params.sessionID, //new session will default to 'unsaved' as the session ID
      userID, //NOTE THAT THIS IS ONLY FOR PUBNUB PURPOSES. THIS IS NOT THAT SPECIFIC USER'S UNIQUE IDENTIFIER
      //these two items operate like dictionaries key: userID, value: cursor/highlight coordinates
      isPilot: true,
      onlineUsers: {}, //serves as a dict from uuid to name
      lines: [
        "Welcome to PearProgram! This is your console. Click the run button to see your output here."
      ],
      toasts: [],
      confusionStatus: {},
      resolve: {},
      seeToasts: true,
      user_name: "",
      msRemaining: MAX_TOGGLE_WAIT,
      fileName: "",
      waitingForInput: false,
      stopExecution: false,
      isRunningCode: false,
    };

    this.updatedUserTable = false;
    
    this.editorRef = null;

    // this.toggleTimer = null;
    this.remindingTipsInterval = null;

    //this allows us to "open files"
    Sk.inBrowser = true;
    //////                                       //////
    //////      Initial Pubnub setup             //////
    //////                                       //////
    this.PubNub = new PubNub({
      subscribeKey: "sub-c-0d65c5d6-7ed5-11eb-ab8f-267aa1707a89",
      publishKey: "pub-c-4da51e8f-f106-4eef-a124-5bc6548b0306",
      uuid: userID,
      state: [],
    });

    this.MessageAuthor = ({ author }) => (
      <div className="author-message">{author}</div>
    );

    //subscribe to channel based on sessionID
    this.PubNub.subscribe({
      channels: [this.state.sessionID],
      withPresence: true,
    });

  }

  /**
   * 
   * @param {function} callback (required). input would be the array itself. 
   * @param {function} errorCallback (optional)
   */
  fetchPilot = (callback, errorCallback) => {
    this.PubNub.objects.getChannelMetadata({
      channel: this.state.sessionID,
      include: {
        customFields: true,
      },
    }, (status, response) => {
      if (status.error && errorCallback) {
        errorCallback();
        return;
      }
      if (callback && response) callback(response.data.custom.pilot);
      //pilot is just uuid
    });
  }

  updateInternalPilot = (pilotID) => {
    const myID = this.state.userID;
    if (!this.state.isPilot && pilotID === myID) {
      this.setState({ isPilot: true });
    } else if (this.state.isPilot && pilotID !== myID) {
      this.setState({ isPilot: false });
    }
  }

  /**
 * @param {array of objects{id, name }} userArray (required)
 * @param {function} callback (required)
 * @param {function} errorCallback (optional)
 */
  setPilot = (pilotID, callback, errorCallback) => {
    this.updateInternalPilot(pilotID);
    const params = {
      channel: this.state.sessionID,
      data: {
        "name": this.state.sessionID,
        "custom": {
          "pilot": pilotID
        }
      }
    };
    this.PubNub.objects.setChannelMetadata(params, (status, response) => {
      if (callback) callback(response);
    });
  }


  updatePresences = (isFirstTime) => {
    const myID = this.state.userID;
    this.PubNub.hereNow({
      channels: [this.state.sessionID],
      includeState: true,
      includeUUIDs: true,
    }, (status, response) => {
      if (!response) {
        console.log(status); //may be because its offline. 
        return;
      }
      const occupants = response.channels[this.state.sessionID].occupants;
      let s = this.state.onlineUsers;
      let unAccountedFor = new Set(Object.keys(s)); // in case someone left
      let changed = false;

      occupants.map(({ uuid, state }) => {
        
        if (!(uuid in s) || !s[uuid]) {
          changed = true;
        }

        if (!state) {
          return; // probably means it's a ghost
        } else if (state.UserName && s[uuid] !== state.UserName) {
          //check that it matches yours 
          s[uuid] = state.UserName;
          changed = true;

        } else if (uuid === myID && this.props.name !== state.UserName) {

          // THIS IS STILL NOT WORK ING 
          //check that your own name matches. 
          console.log('myID didnt match', 'state', state, 'name', this.props.name);
          s[uuid] = this.props.name;
          changed = true;

          this.PubNub.setState({
            state: { UserName: this.props.name },
            channels: [this.state.sessionID],
          }, function (status, response) {
            console.log('setstate pubnub response', response);
            if (status.isError) {
              console.log(status);
            }
          });
        } else if (!s[uuid]) { // you don't already have a name for it. 
          //make the default: 
          s[uuid] = "Guest";
          changed = true;

        }
        unAccountedFor.delete(uuid);
      });

      if (unAccountedFor.size > 0) {
        changed = true;
        [...unAccountedFor].map((uuid) => delete s[uuid]);
      }


      if (isFirstTime) {
        changed = true;
        s[this.state.userID] = this.props.name;
        this.fetchPilot((pilotID) => {
          //if you're the only one, or if 
          if (occupants.length === 0 || (occupants.length === 1 && occupants[0].uuid === myID) || !(pilotID in s)) {
            //i am the new pilot! 
            // set to me. 
            this.setPilot(myID);
          } else {
            this.setState({ isPilot: false })
          }
        }, () => this.setPilot(myID)); // pilot hasn't been set yet if there's an error.
      } else {
        this.fetchPilot((pilotID) => {
          if (!(pilotID in s)) {
            const sorted = Object.keys(s).sort();
            if (sorted[0] === myID) {
              //you came first! 
              this.setPilot(myID);
            }
          } 
          this.updateInternalPilot(pilotID);
          if (!this.state.isPilot && Object.keys(s).length === 1) {
            this.setPilot(myID)
          }
        });
      }

      if (changed) {
        this.setState({ onlineUsers: s });
      }
    });
  }

  componentDidUpdate(prevProps, _) {
    if ((this.props.userSignature || prevProps.userSignature) && !this.updatedUserTable) {
      //now, update the sessions of the user
      const session = this.props.match.params.sessionID;
      apiPutCall("updateSessions/" + this.props.userSignature, { session });
      this.updatedUserTable = true;
    }
  }


  componentDidMount() {

    // initial update
    this.updatePresences(true);

    // updates every 6 seconds.
    this.hereNowInterval = setInterval(() => {
      this.updatePresences();
    }, 4000);


    window.addEventListener("beforeunload", event => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";

      this.unsubscribeChannel();
    });


    //add PubNub listener to handle messages
    this.PubNub.addListener({
      message: ({ _, message }) => {
        if (
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
          (message.Type === "codeOutput") &
          (message.Who !== this.state.userID)
        ) {
          this.setState({ lines: message.What });
        } 
      },
      objects: ({ message }) => {
        if (!message.data.custom.pilot) return;
        const pilotID = message.data.custom.pilot;
        this.updateInternalPilot(pilotID);
      },
    });
    const session = this.props.match.params.sessionID;


    this.setState({ startTime: String(new Date()) });

    const self = this;
    if (this.props.match.path !== "/") {
      this.setState({ sessionID: session });
      this.handleSessionIDChange(session);
      apiGetCall("getName/" + session, function (response) {
        if (!response.data) {
          self.setState({ fileName: "untitled document" });
        } else {
          self.setState({ fileName: response.data }, () => { });
        }
        self.setState({ titleLoaded: true });
      }, function () {
        self.setState({ titleLoaded: true });
        // handle error
      })
    }

    //set the username. this is used in things like toggle
    this.PubNub.setState({
      state: { UserName: this.props.name },
      channels: [this.state.sessionID],
    }, function (status, response) {
      if (status.isError) {
        console.log(status);
      }
    });

    this.setState({ user_name: this.props.name });

    //now, update the sessions of the user
    //remember to try this again in case it's an ohyay user
    if (this.props.userSignature) {
      this.updatedUserTable = true;
      apiPutCall("updateSessions/" + this.props.userSignature, { session });
    }
    
  }

  packageMessage(what, type) {
    //package either cursor or selection change into message
    //object and send it in SplitText.js sendMessage function
    const messageObj = {
      Who: this.state.userID,
      UserName: this.props.name,
      Type: type,
      What: what,
      When: new Date().valueOf()
    };

    if (
      type === "codeOutput" ||
      type === "confused" ||
      type === "resolve" ||
      type === "comment" ||
      type === "chat"
    ) {
      let who = this.props.userSignature || this.props.name;
      const data = { event: String(new Date()), who, type };
      apiPutCall("updateTimeStamps/" + this.state.sessionID, data);
    }

    //send cursor/selection message on sessionID channel
    this.PubNub.publish(
      { channel: this.state.sessionID, message: messageObj },
    );
  }

  setEditorRef = editorRef => {
    this.editorRef = editorRef;
  }

  setCodeText = text => {
    this.codeText.current = text;
  }

  /**
   * updates the temporal length of the session 
   */
  putSessionLength = async () => {

    const who = this.props.userSignature || this.props.name;
    const data = { start: this.state.startTime, end: String(new Date()), who };
    apiPutCall("updateSessionLength/" + this.state.sessionID, data);
  };

  unsubscribeChannel = () => {
    this.packageMessage("", "leave");
    this.PubNub.unsubscribeAll();
    this.putSessionLength();
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

  handleInterrupt = () => {
    this.setState({ stopExecution: true });
  };

  /////   runCode handles using the current text in state
  /////            and running it as python code
  runCode() {
    //set stopExecution to false whenever run is clicked
    this.setState({ stopExecution: false, isRunningCode: true }, () => {
      const builtinRead = x => {
        if (
          Sk.builtinFiles === undefined ||
          Sk.builtinFiles["files"][x] === undefined
        ) {
          throw new Error("File not found: '" + x + "'");
        }
        return Sk.builtinFiles["files"][x];
      };

      var input = this.editorRef.current.editor.getValue();;
      this.setState(prevState => ({
        lines: [...prevState.lines, "pair-programming-session:~ $ run"]
      }));
      var self = this;

      Sk.configure({
        output: this.outf,
        KeyboardInterrupt: true,
        yieldLimit: 100,
        execLimit: 20000,
        read: builtinRead,
        // execLimit: 8000,
        inputfun: function (prompt) {
          self.setState(prevState => ({
            lines: [...prevState.lines, prompt],
            waitingForInput: true
          }));

          document.getElementById("interrupt-button").onclick = e => {
            //allow for interrupt when user input is required
            return new Promise(function (resolve, reject) {
              self.setState(
                prevState => ({
                  lines: [...prevState.lines, "Execution Interrupted", "<<<<<<<<<< Program finished running >>>>>>>>>>"],
                  waitingForInput: false,
                  stopExecution: false,
                  isRunningCode: false,
                }),
                () => resolve("Execution Interrupted")
              );
            });
          };

          // if(self.state.stopExecution===false){
          document.getElementById("std-input").focus();
          return new Promise(function (resolve, reject) {
            document.getElementById("std-input").onkeyup = e => {
              if (e.keyCode === 13) {
                //add input to lines
                self.setState(
                  prevState => ({
                    lines: [...prevState.lines, `> ${e.target.value}`],
                    waitingForInput: false,
                    stopExecution: false
                  }),
                  () => resolve(e.target.value)
                );
                //clear the input
              }
            };
          });
        },
        inputfunTakesPrompt: true
      });

      try {
        Sk.misceval
          .asyncToPromise(
            function () {
              return Sk.importMainWithBody("<stdin>", false, input, true);
            },
            {
              "*": () => {
                if (this.state.stopExecution) {
                  throw new Error("Execution Interrupted");
                  // allow for general interrupt
                }
              }
            }
          )
          .then(() => {
            self.setState(
              prevState => ({
                lines: [
                  ...prevState.lines,
                  "<<<<<<<<<< Program finished running >>>>>>>>>>"
                ],
                isRunningCode: false,
              }),
              () => self.packageMessage(self.state.lines, "codeOutput")
            );
          })
          //when there's a compile or runtime error
          .catch(e => {
            self.setState(
              prevState => ({
                stopExecution: false,
                isRunningCode: false,
                lines: [
                  ...prevState.lines,
                  e.toString(),
                  "<<<<<<<<<< Program finished running >>>>>>>>>>"
                ]
              }),
              () => self.packageMessage(this.state.lines, "codeOutput")
            );
          });
      } catch (e) {
        self.setState(
          prevState => ({
            stopExecution: false,
            lines: [
              ...prevState.lines,
              e.toString(),
              "<<<<<<<<<< Program finished running >>>>>>>>>>"
            ]
          }),
          () => self.packageMessage(this.state.lines, "codeOutput")
        );
      }

    });

    let sessionID = this.state.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const url = ENDPOINT + "updateRunCount/" + sessionID;

      let data = { timeStamp: String(new Date()) };

      axios.put(url, data).then(
        _ => { },
        error => {
          console.log(error);
        }
      );
    }
  }
  /**
   * When we can actually carry through with the .py download. 
   */
  handleFinishDownload = () => {
    this.setState({ showDownloadForm: false });
    const element = document.createElement("a");
    const file = new Blob([this.codeText.current], { type: "text/x-python" });
    console.log(this.codeText);
    element.href = URL.createObjectURL(file);
    element.download = this.state.fileName + '.py'; // change to 
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  //////                                                    //////
  //////   Functions that handle state changes/updates      //////
  //////                                                    //////

  handleSessionIDChange(id) {
    //on sessionID change (session was loaded), unsubscribe
    this.PubNub.unsubscribe({ channels: [this.state.sessionID] });

    //set the sessionID in state and subscribe to new channel based on sessionID
    this.setState({ sessionID: id }, () => {
      //use callback due to asynchronous nature of .setState
      this.PubNub.subscribe({
        channels: [id],
        withPresence: true
      });
      this.updatePresences();
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

    clearInterval(this.hereNowInterval);
    this.unsubscribeChannel();
    window.removeEventListener("beforeunload", this.unsubscribeChannel);
    clearInterval(this.remindingTipsInterval);
  }

  basicSetState = stateChange => this.setState(stateChange);

  ////                              ////
  ////      Chat Stuff              ////
  ////                              ////

  handleNewUserMessage = newMessage => {

    const url = ENDPOINT + "updateChat/" + this.state.sessionID;
    let who = this.props.userSignature || this.props.name;
    let data = { message: String(new Date()), who, newMessage };

    axios.put(url, data).then(
      _ => {},
      error => {
        console.log(error);
      }
    );

    // package chat text and send through PubNub
    this.packageMessage(newMessage, "chat");
  };

  render() {
    const {
      sessionID,
      userID,
      isPilot,
      lines: codeOutput,
    } = this.state;
    const history = this.props.history;

    let container = document.getElementById("toasts-container");
    if (container) {
      //delay the scrolling by .1 seconds so that it has time to account for the new toast
      setTimeout(() => (container.scrollTop = container.scrollHeight), 100);
    }

    return isMobile ? (
      <div>
        Oy! Looks like you're trying to code on a mobile device. Please try
        accessing this programming tool with a tablet or computer.
      </div>
    ) : this.state.titleLoaded ? (
      <div>
       
        <Container fluid style={{ padding: 0, margin: 0 }}>
          <Row noGutters={true} style={{ justifyContent: "center" }}>
            
            <ToolBar
              isPilot={isPilot}
              userID={userID}
              sessionID={sessionID}
              editorRef={this.editorRef}
              userName={this.props.name}
              onlineUsers={this.state.onlineUsers}
              fetchPilot={this.fetchPilot}
              history={history}
              setPilot={this.setPilot}
              handleIDChange={this.handleSessionIDChange}
              handleDownload={this.handleFinishDownload}
              title={this.state.fileName}
              userSignature={this.props.userSignature}
              numUsers={this.state.numUsers}
              changeShowFirstTimerModal={this.changeShowFirstTimerModal}
            />
          </Row>
          <Row noGutters={true} className="split-text-container">
            <SplitPane
              //One side input, other side output, once we get app to run code?
              split="vertical"
              minSize={500}
              defaultSize={window.innerWidth / 2}
              style={{ bottom: 0, top: 70, height: "auto" }} //window.innerHeight-80}}
              pane2Style={{ overflow: "scroll", backgroundColor: "#292a2e", overflowX: "hidden" }}
              resizerStyle={{ border: "5px solid black" }}
            >
              <TextInput
                side="left"
                isPilot={isPilot}
                sessionID={sessionID}
                userID={userID}
                pubnub={this.PubNub}
                handleRun={this.runCode}
                setEditorRef={this.setEditorRef}
                addToast={this.addToast}
                user_name={this.props.name}
                setParentText={this.setCodeText}
                packageMessage={this.packageMessage}
                isRunningCode={this.state.isRunningCode}
                handleInterrupt={this.handleInterrupt} // to stop code
              />
              <TextOutput
                side="right"
                text={codeOutput}
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
            {/* <FormControlLabel
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
            /> */}
            <Widget
              handleNewUserMessage={this.handleNewUserMessage}
              title="Teammate Chat"
              subtitle=""
            />
          </Row>
        </Container>
      </div>
    ) : (
      <Loading />
    );
  }
}

export default SplitText;
