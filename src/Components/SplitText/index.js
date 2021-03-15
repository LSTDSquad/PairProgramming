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
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { RemindingTipMessages } from "../../utilities/SessionUtilities";
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
const MS_BETWEEN_TIME_CHECKS = 60 * 1000; //60 seconds
const MINUTES_BETWEEN_TIPS = 10;

/**
 * props: 
 * attributes: {name, email}
 */
class SplitText extends React.Component {
  constructor(props) {
    super(props);
    //used for splitPane, i think. (textOutput)
    this.outputRef = React.createRef();
    this.inputRef = React.createRef();

    //BINDINGS
    this.setEditorRef = this.setEditorRef.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.runCode = this.runCode.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.addToast = this.addToast.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.pilotHandoff = this.pilotHandoff.bind(this);
    this.basicSetState = this.basicSetState.bind(this);
    this.handleDownloadChange = this.handleDownloadChange.bind(this);
    this.changeShowFirstTimerModal = this.changeShowFirstTimerModal.bind(this);
    this.changeShowRemindingTip = this.changeShowRemindingTip.bind(this);
    const userID = PubNub.generateUUID();

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
      userArray: [], //in format: [{id, name}...]
      lines: [
        "Welcome to PearProgram! This is your console. Click the run button to see your output here."
      ],
      toasts: [],
      confusionStatus: {},
      resolve: {},
      seeToasts: true,
      user_name: "",
      showCopilotToggleMsg: false,
      msRemaining: MAX_TOGGLE_WAIT,
      fileName: "",
      waitingForInput: false,
      showDownloadForm: false,
      isFirstSessionEver: false,
      stopExecution: false,
      showRemindingTip: false,
      tipMessage: "",
      isRunningCode: false,
    };
    this.editorRef = null;

    this.toggleTimer = null;
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
      presenceTimeout: 20, // this is working! 
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
  fetchUserArray = (callback, errorCallback) => {
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
      if (callback && response) callback(JSON.parse(response.data.custom.userArray));
    });
  }

  /**
   * @param {array of objects{id, name }} userArray (required)
   * @param {function} callback (required)
   * @param {function} errorCallback (optional)
   */
  setUserArray = (userArray, callback, errorCallback) => {
    const params = {
      channel: this.state.sessionID,
      data: {
        "name": this.state.sessionID,
        "custom": {
          "userArray": JSON.stringify(userArray)
        }
      }
    };
    this.PubNub.objects.setChannelMetadata(params, (status, response) => {
      if (callback) callback(response);
    });
  }

  fullUpdateUserArray = (userArray) => {
    this.setState({ userArray });
    //update it for others. 
    this.setUserArray(userArray);
    this.assignRole();
  }

  componentDidMount() {

    window.addEventListener("beforeunload", event => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";

      this.unsubscribeChannel();
    });
    const attributes = this.props.attributes;


    //add PubNub listener to handle messages
    this.PubNub.addListener({
      message: ({ channel, message }) => {

        if (message.Type === "userArray") {
          // console.log(message.What, "user Array");
          //after the first person joins, they will get this package
          //this could also be used whenever someone else updates the user array.
          // this.setState({ userArray: message.What }, () => this.assignRole());
        } else if (
          message.Type === "leave" &&
          message.Who !== this.state.userID
        ) {
          // let userArr = this.state.userArray;
          // const i = userArr.map(user => user.id).indexOf(message.Who);
          // if (i !== -1) {
          //   userArr.splice(i, 1);
          // }
          // this.setState({ userArray: userArr }, () => this.assignRole());
          // delete this.state.cursors[message.Who];
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
          (message.Type === "codeOutput") &
          (message.Who !== this.state.userID)
        ) {
          this.setState({ lines: message.What });
        } else if (message.Type === "toggleRequest") {
          if ((message.Who !== this.state.userID) & this.state.isPilot) {
            // you're the pilot and your partner requested to switch.
            this.toggleAlert(message.Who, message.UserName);
          } else if (message.Who === this.state.userID) {
            //you are the copilot and you requested the handoff. 
            this.setState({ showCopilotToggleMsg: true });

            //MAYBE I CAN JUST RELY ON THE PILOT SENDING THE MESSAGE AND UPDATING THE USER ARRAY. 
            //this timer is cleared in assignRole
            // this.toggleTimer = setInterval(() => {
            //   if (this.state.msRemaining > 0) {
            //     //decrement the number of milliseconds that's displayed
            //     this.setState({ msRemaining: this.state.msRemaining - 1000 });
            //   } else {
            //     //time is up!
            //     this.setState({
            //       showCopilotToggleMsg: false
            //     });
            //     this.assignRole();
            //     let timer;
            //     timer = setTimeout(() => {
            //       //reset
            //       this.setState({ msRemaining: MAX_TOGGLE_WAIT });
            //       clearTimeout(timer);
            //       //clear the countdown
            //     }, 300);
            //   }
            // }, 1000);
          }
        } else if (message.Type === "toggleResponse") {
          //the pilot declined and you're the copilot
          if ((message.What === "decline") & this.state.showCopilotToggleMsg) {
            // clearInterval(this.toggleTimer);
            // this.toggleTimer = null;
            this.setState({
              showCopilotToggleMsg: false
            });
            // let timer;
            // timer = setTimeout(() => {
            //   this.setState({ msRemaining: MAX_TOGGLE_WAIT });
            //   clearTimeout(timer);
            // }, 300);
          }
        }
      },
      presence: ({ action, occupancy, state, uuid }) => {
        // console.log("me", this.state.userID);
        // console.log("uuid", uuid);
        // console.log("occupancy", occupancy);
        let userArr = this.state.userArray;
        function isInUserArr(u, userArray) {
          const found = userArray.find(person => person.id === u);
          return Boolean(found);
        }

        if (action === 'join' && uuid === this.state.userID) {
          //I joined! 
          // get all the occupants before you. 
          this.PubNub.hereNow({
            channels: [this.state.sessionID],
            includeState: true,
            includeUUIDs: true,
          }, (_, response) => {
            const occupants = response.channels[this.state.sessionID].occupants;
            // console.log("occupants", occupants);
            const myself = { id: this.state.userID, name: attributes.name };
            //there is no one else here yet. 
            if (occupants.length <= 1) {
              const userArr = [myself];
              this.fullUpdateUserArray(userArr);
            } else {
              this.fetchUserArray((userArray) => {
                //clean up 
                const realOccupants = new Set(occupants.map(({ uuid }) => uuid));
                userArray = userArray.filter(({ id }) => realOccupants.has(id));
                // if (isInUserArr(uuid, userArray)) {
                //   return;
                // }

                userArray.push(myself);
                this.fullUpdateUserArray(userArray);
              }, () => {
                const userArr = [myself];
                this.fullUpdateUserArray(userArr);
              });
            }
          });

        } else if (action === 'leave') {
          if (occupancy === 0) {
            this.fullUpdateUserArray([]);
            return;
          }
          const i = userArr.findIndex(({ id }) => id === uuid);
          if (i !== -1) {
            userArr.splice(i, 1);
          } else {
            return;
          }
          this.fullUpdateUserArray(userArr);

        } else if (action === 'timeout') {
          console.log('timeout', uuid);
          if (occupancy === 0) {
            this.fullUpdateUserArray([]);
          }
          const i = userArr.findIndex(({ id }) => id === uuid);
          if (i !== -1) {
            userArr.splice(i, 1);
          } else {
            return;
          }
          this.fullUpdateUserArray(userArr);
        } else if (action === 'state-change' && state.name) {
        }
      },
      objects: ({ message }) => {
        // console.log("object", message.data.custom);
        if (!message.data.custom.userArray) return;
        const userArray = JSON.parse(message.data.custom.userArray);
        if (userArray === undefined) {
          return;
        }
        this.setState({ userArray });
        this.assignRole();
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
      state: { UserName: attributes.name },
      channels: [this.state.sessionID],
    }, function (status, response) {
      if (status.isError) {
        console.log(status);
      }
    });

    this.setState({ user_name: attributes.name });

    this.changeShowFirstTimerModal(true);

    //now, update the sessions of the user
    apiPutCall("updateSessions/" + attributes.email, { session });

    //set once!
    //for the reminder tips that pop up
    this.remindingTipsInterval = setInterval(() => {
      const now = new Date();
      //tip on the 00:10, :20, etc. of the time
      if (now.getMinutes() % MINUTES_BETWEEN_TIPS === 0) {
        this.changeShowRemindingTip(true);
        //make a global array that has the tip messages. length 6
        //based on getMinutes() / MINUTES_BETWEEN_TIPS
        const tipNum = Math.floor(now.getMinutes() / 10);
        this.setState({ tipMessage: RemindingTipMessages[tipNum] });
      }
    }, MS_BETWEEN_TIME_CHECKS);
  }
  /**
   * togglePilot
   * this happens to those who are switching from pilot to copilot. they
   * send a userArray packageMessage to let others know that they are now a ilot.
   * params id and name: those of the requester.
   */
  togglePilot = (uuid, name) => {
    let userArr = this.state.userArray;
    //requester: the index of the requester
    const requester = userArr.findIndex(({ id }) => id === uuid);
    userArr[0] = { id: uuid, name };
    userArr[requester] = { id: this.state.userID, name: this.state.user_name };
    this.setState({ isPilot: false, userArray: userArr });
    this.setUserArray(userArr);
    const sessionID = this.state.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      apiPutCall("updateToggleCount/" + sessionID, { timeStamp: String(new Date()) });
    }
  };
  /**
   * toggleAlert
   * happens to the pilot if the copilot wants to switch roles
   */
  toggleAlert = (id, name) => {
    //function to bypass Chrome blocking alerts on background windows

    let currentComponent = this;

    var toggleTimeout = setTimeout(function () {
      //switch because time is up!
      currentComponent.togglePilot(id, name);

      confirmAlert({
        title: "Pilot Time Out",
        message: "You timed out and are now co-pilot",
        buttons: [{ label: "Ok" }]
      });
      clearTimeout(toggleTimeout);
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
            this.packageMessage("decline", "toggleResponse");
            clearTimeout(toggleTimeout);
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
      let who = this.state.user_name;
      const data = { event: String(new Date()), who, type };
      apiPutCall("updateTimeStamps/" + this.state.sessionID, data);
    }

    //send cursor/selection message on sessionID channel
    this.PubNub.publish(
      { channel: this.state.sessionID, message: messageObj },
      function (status, response) { }
    );
  }

  setEditorRef = editorRef => {
    this.editorRef = editorRef;
  }

  /**
   * updates the temporal length of the session 
   */
  putSessionLength = async () => {

    const who = this.state.user_name;
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
   * to be called when we want the predownload form shown, and also someone is trying to download
   */
  handleDownload = () => {
    this.setState({ showDownloadForm: true });
  };

  /**
   * When we can actually carry through with the .py download. 
   */
  handleFinishDownload = () => {
    this.setState({ showDownloadForm: false });
    const element = document.createElement("a");
    const file = new Blob([this.state.text], { type: "text/x-python" });
    element.href = URL.createObjectURL(file);
    element.download = "pearprogram.py"; // change to 
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


  /**
   * //from pilot to copilot
   * the callback that is passed into the swap button. 
   */
  pilotHandoff = () => {
    //swap with the second one
    let userArr = this.state.userArray;
    userArr[0] = userArr[1];
    userArr[1] = { id: this.state.userID, name: this.state.user_name };

    this.setState({ userArray: userArr })
    this.setUserArray(userArr);

    const url = ENDPOINT + "updateTimeStamps/" + this.state.sessionID;

    let type = "pilotHandoff";
    let who = this.state.user_name;
    let data = { event: String(new Date()), who, type };

    axios.put(url, data).then(
      _ => { },
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
        _ => { },
        error => {
          console.log(error);
        }
      );
    }
  };
  /**
   * assigns role based on the user Array.
   * if you're the copilot and you get notified of the userArray change from the pilot
   * because of your toggle request, then THIS is how you make the toggleTimer
   * null again and hide the copilot toggle msg
   */
  assignRole = () => {
    //assign role based on userArray
    if (this.state.userArray.findIndex(({ id }) => id === this.state.userID) === 0) {
      //now is the pilot
      this.setState({ isPilot: true });
      //wait until here! to turn off the copilot toggle msg
      if (this.state.showCopilotToggleMsg) {
        //you were the copilot waiting for the handoff!
        this.setState({
          showCopilotToggleMsg: false,
          msRemaining: MAX_TOGGLE_WAIT
        });
      }
    } else {
      //you're not the pilot
      this.setState({ isPilot: false });
    }
    clearInterval(this.toggleTimer);
    this.toggleTimer = null;
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


    this.unsubscribeChannel();
    window.removeEventListener("beforeunload", this.unsubscribeChannel);
    clearInterval(this.remindingTipsInterval);
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

    axios.put(url, data).then(
      response => {
        const message = response.data;
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

  changeShowFirstTimerModal(newValue) {
    this.setState({ isFirstSessionEver: newValue });
  }

  changeShowRemindingTip(newValue) {
    this.setState({ showRemindingTip: newValue });
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

    return isMobile ? (
      <div>
        Oy! Looks like you're trying to code on a mobile device. Please try
        accessing this programming tool with a tablet or computer.
      </div>
    ) : this.state.titleLoaded ? (
      <div>
        {/* <PredownloadModal
          show={this.state.showDownloadForm}
          handleDownloadChange={this.handleDownloadChange}
          handleFinishDownload={this.handleFinishDownload}
        /> */}
        {/* <FirstTimerModal
          show={this.state.isFirstSessionEver}
          changeFirstTimerModalState={this.changeShowFirstTimerModal}
        /> */}
        {/* <RemindingTipModal
          show={this.state.showRemindingTip}
          changeShowRemindingTip={this.changeShowRemindingTip}
          tipMessage={this.state.tipMessage}
        /> */}
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
              editorRef={this.editorRef}
              userArray={this.state.userArray}
              history={history}
              packageMessage={this.packageMessage}
              handleIDChange={this.handleSessionIDChange}
              pilotHandoff={this.pilotHandoff}
              handleDownload={this.handleFinishDownload}
              title={this.state.fileName}
              numUsers={this.state.numUsers}
              changeShowFirstTimerModal={this.changeShowFirstTimerModal}
            // handleToggle={this.toggleRole}
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
                user_name={this.state.user_name}
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
        <div id="hello.txt" style={{ display: "none" }}>{`hello\nworld\n`}</div>
      </div>
    ) : (
          <Loading />
        );
  }
}

export default SplitText;
