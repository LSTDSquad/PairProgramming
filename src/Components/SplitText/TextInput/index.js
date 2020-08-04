import React from "react";
import AceEditor from "react-ace";
import {
  AceMultiCursorManager,
  AceMultiSelectionManager
} from "@convergencelabs/ace-collab-ext";
import { Range } from "ace-builds/";
import axios from "axios";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-cobalt";
import "@convergencelabs/ace-collab-ext/css/ace-collab-ext.css";
import {
  Container,
  Button,
  Popover,
  OverlayTrigger,
  Alert,
  Form,
  Tooltip
} from "react-bootstrap";
import "./TextInput.css";
import SplitPane from "react-split-pane";
import {
  PlayArrowRounded,
  SendRounded,
  HelpOutlineRounded,
  DoneRounded,
  CommentRounded
} from "@material-ui/icons";
import { ENDPOINT } from "../../endpoints";
import HoverClickPopover from "../../HoverClickPopover";

/*
Props:
cursors: in the form {10392: cursorPositionObject, }


*/
class TextInput extends React.Component {
  //individual text boxes that send state to split view
  constructor(props) {
    super(props);

    this.state = {
      selected: null,
      //must keep track of annotations in state in case there's multiple annotaitons
      annotations: [],

      cursor: null,
      confusedMsg: "", //
      markers: [],
      commentMsg: "",
      //showign the confusion popup for entering the confusion
      showConfused: false,
      confusedHover: false,
      showComment: false,
      commentError: false,
      confusedError: false,
      confusionStatus: {}, //object with fields 'selected' and 'confusedMsg', confusionPresent (liek in state)
      resolve: {}, //object with fields 'markers' and 'showConfused' (like in state)
      clickedRecently: false //so that we filter out all the cursorChange noise
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.basicSetState = this.basicSetState.bind(this);
    this.getConfusedPopover = this.getConfusedPopover.bind(this);

    this.editor = React.createRef(); //will reference Ace Editor
    this.session = Object;
    this.doc = Object;
    this.curMgr = Object; //empty cursor manager
    this.selMgr = Object; //empty selection manager
    this.input = Object;
  }

  componentDidMount() {
    this.editor = this.refs.editor.editor; //set reference to ace editor
    // console.log(this.editor);
    let ace_div = document.getElementById("UNIQUE_ID_OF_DIV");
    ace_div.onmousedown = e => {
      this.setState({ clickedRecently: true });
    };
    ace_div.onmouseup = () => {
      //after 500ms, clickedRecently is false.
      const timer = setTimeout(() => {
        this.setState({ clickedRecently: false })
        clearTimeout(timer);
      }, 500);
    };

    this.session = this.editor.getSession();
    this.session.$useWorker = false;
    this.doc = this.session.getDocument();
    let currentComponent = this;

    //add keyboard listener to ace editor to record which key was pressed
    //for filtering out the cursorChange noise
    this.editor.keyBinding.addKeyboardHandler(function(
      data,
      hashId,
      keyString,
      keyCode,
      e
    ) {
      if (
        keyCode === 37 ||
        keyCode === 38 ||
        keyCode === 39 ||
        keyCode === 40
      ) {
        currentComponent.setState({ clickedRecently: true });
        const timer = setTimeout(
          () => {
            currentComponent.setState({ clickedRecently: false });
            clearTimeout(timer);
          },
          500
        );
      }
    });

    this.curMgr = new AceMultiCursorManager(this.session); //setup cursor manager in reference to editor
    // this.curMgr.addCursor(this.props.userID, this.props.userID, "orange"); //add this window's curser to the cursor manager

    this.selMgr = new AceMultiSelectionManager(this.editor.getSession()); //setup selection manager in reference to editor

    // this.selMgr.addSelection(this.props.userID, this.props.userID, "yellow"); //add this window's selection to cursor manager
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    //check if confusionStatus has changed since last update
    if (nextProps.confusionStatus !== prevState.confusionStatus) {
      return { confusionStatus: nextProps.confusionStatus };
    } else if (nextProps.resolve !== prevState.resolve) {
      return { resolve: nextProps.resolve };
    } else return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.confusionStatus !== this.props.confusionStatus) {
      //add confusion markers if props update with confusion
      this.receiveConfused();
    }

    if (prevState.resolve !== this.props.resolve) {
      //remove confusion markers if props update with resolved confusion
      this.session.setAnnotations([]);
      this.setState({ annotations: [], markers: [] });
    }

    //should stay the same even after changing from listener to packageMessage
    for (const userID of Object.keys(this.curMgr._cursors)) {
      //remove other user's cursors from previous session from the cursor manager on sessionID change
      if (Object.keys(this.props.cursors).includes(userID) === false) {
        // console.log("removed cursor");
        this.curMgr.removeCursor(userID);
      }
    }

    for (const userID of Object.keys(this.selMgr._selections)) {
      //remove other user's selection from previous session from the selection manager on sessionID change
      if (Object.keys(this.props.selections).includes(userID) === false) {
        this.selMgr.removeSelection(userID);
      }
    }

    // run this loop when other window changes, not when it itself changes
    // i.e cursors gets updated when message is sent
    for (const [key, { msg: value, name }] of Object.entries(
      this.props.cursors
    )) {
      //if another user's cursor not in this of cursor manager, add it
      if (Object.keys(this.curMgr._cursors).includes(key) === false) {
        this.curMgr.addCursor(key, name, "orange");
      }

      //if another user updates their cursor another window,
      if (
        key !== this.props.userID &&
        //and there's a new position that is different from what we have on our window,
        JSON.stringify(value) !==
          JSON.stringify(this.curMgr._cursors[key]._position)
      ) {
        //move their cursor on this window
        // console.log("setting cursor", key, value, this.curMgr._cursors[key]);
        this.curMgr.setCursor(key, { row: value.row, column: value.column });
      }
    }

    for (const [key, { msg: value, name }] of Object.entries(
      this.props.selections
    )) {
      //if another user's selection not in this selection manager, add it
      if (Object.keys(this.selMgr._selections).includes(key) === false) {
        this.selMgr.addSelection(key, name, "yellow");
      }
      //if another user updates their selection another window, move their selection on this window
      if (key !== this.props.userID) {
        this.selMgr.setSelection(
          key,
          new Range(
            value.start.row,
            value.start.column,
            value.end.row,
            value.end.column
          )
        );
      }
    }
  }

  handleChange(e, event) {
    function selectionToCode(sel) {
      const { start, end } = sel.getRange();
      return sel.doc.$lines.slice(start.row, end.row + 1);
    }

    //to give the document time to register the mouse click!
    const timer = setTimeout(
      () => {
        // console.log(event.type, this.state.clickedRecently);
        //If the cursor changes due to arrow key movement
        // 37-40 are the key codes corresponding to arrow keys
        // 0 corresponds to mouse click //actually i dont' think it does
        if (event.type === "changeCursor" && this.state.clickedRecently) {
          //it genuinely thinks it's changing the cursor. event type stays as changeCursor.
          event.preventDefault();
          var cursorPosition = e.getCursor();
          // console.log(cursorPosition);
          //current issue: somehow it thinks there are mouse clicks when there really arent'
          this.props.packageMessage(cursorPosition, "cursor");
        }

        //only send selection messages after mouseclick or typing, not with every change in text
        else if (
          event.type === "changeSelection" &&
          this.state.clickedRecently
        ) {
          const selectionRange = e.getRange();
          selectionRange.code = selectionToCode(e);
          setTimeout(() => this.setState({ selected: selectionRange }), 300);
          this.props.packageMessage(selectionRange, "selection");
        }

        //ignore the cursor change events that emerge with typing...
        //and instead use the cursor positions from the two event actions
        else if (event.action === "insert" || event.action === "remove") {
          if (event.action === "insert") {
            cursorPosition = event.end;
          } else if (event.action === "remove") {
            cursorPosition = event.end;
            cursorPosition.column--;
          }

          this.props.onTextChange(e); //update text for this through state
          this.props.packageMessage(e, "text"); //synch text through pubnub
          this.handleTextChange(e); //save updated text to dynamoDB
        }
        clearTimeout(timer);
        //the cursor thing is only a problem for the copilots. the pilot when typing is totally ok.
        //300ms is about enough time to make sure the clickedRecently state is already set.
      },
      this.props.isPilot ? 0 : 300
    );
  }

  handleTextChange(e) {
    //uses session ID from props to either update backend
    let data = { text: this.props.text };
    let sessionID = this.props.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const updateTextURL = ENDPOINT + "updateData/" + sessionID;

      axios.put(updateTextURL, data).then(
        response => {
          const message = response.data;
          // console.log(message);
        },
        error => {
          console.log(error);
        }
      );

      const updateLastEditURL = ENDPOINT + "updateLastEdit/" + sessionID;
      let editTimestamp = { timestamp: String(new Date()) };
      axios.put(updateLastEditURL, editTimestamp).then(
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

  handleConfused = event => {
    event.preventDefault();
    if (!/\S/.test(this.state.confusedMsg)) {
      //only white space
      this.setState({ confusedError: true });
      return;
    }
    this.setState({ confusedError: false });
    //this.state.selected is in this form: {start: {row:, column:}, end{row:, column:}}
    this.processConfused(this.state);
    const { selected, confusedMsg } = this.state;
    let { end } = selected;
    selected.start.column = 0;
    selected.end = { row: end.row + 1, column: 0 };
    this.props.packageMessage({ selected, confusedMsg }, "confused");

    let sessionID = this.props.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const url = ENDPOINT + "updateConfusionCount/" + sessionID;

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
  };

  processConfused = ({ selected, confusedMsg }) => {
    let { start, end } = selected;
    selected.start.column = 0;
    selected.end = { row: end.row, column: 0 };
    //update other users window when question is asked
    let currAnnotations = this.state.annotations || [];
    let markers = this.state.markers || [];
    this.session.setAnnotations([
      ...currAnnotations,
      {
        row: start.row,
        html: `<div>${confusedMsg}</div>`,
        type: "error"
      }
    ]);
    let newToast = {
      type: "confused",
      msg: confusedMsg,
      show: true,
      ...selected
    };
    this.props.addToast(newToast);
    this.setState({
      annotations: [
        ...currAnnotations,
        {
          row: start.row,
          html: `<div>${confusedMsg}</div>`,
          type: "error"
        }
      ],
      showConfused: false,
      markers: [
        ...markers,
        {
          startRow: start.row,
          endRow: end.row,
          startCol: start.column,
          endCol: end.column,
          className: `confused-marker`,
          type: "text"
        }
      ]
    });
  };

  receiveConfused = () => {
    // const {selected, confusedMsg} = this.props.confusionStatus;
    this.processConfused(this.props.confusionStatus);
  };

  getConfusedPopover = ({ ...props }) => {
    return (
      <Popover {...props} className="confused-popover">
        {this.state && this.state.selected ? (
          <Form onSubmit={this.handleConfused}>
            <Form.Label>Briefly describe your confusion.</Form.Label>
            {this.state.confusedError && (
              <Alert variant="danger">Please enter a note.</Alert>
            )}
            <div className="confused-input">
              <Form.Control
                onChange={event => {
                  this.setState({ confusedMsg: event.target.value });
                }}
                size="md"
                type="text"
                // placeholder="briefly describe your confusion."
              ></Form.Control>
              <Button variant="primary" type="submit">
                <SendRounded />
              </Button>
            </div>
          </Form>
        ) : (
          <Alert variant="danger">
            Please first select the code you're confused about.
          </Alert>
        )}
      </Popover>
    );
  };

  handleComment = event => {
    event.preventDefault();
    if (!/\S/.test(this.state.commentMsg)) {
      //only white space
      this.setState({ commentError: true });
      return;
    }
    this.setState({ commentError: false });
    // console.log(this.state.selected, this.state.commentMsg);

    // let { start, end } = this.state.selected;
    let newToast = {
      type: "comment",
      msg: this.state.commentMsg,
      show: true,
      ...this.state.selected
    };

    this.props.packageMessage(newToast, "comment");

    this.props.addToast(newToast);
    this.setState({ showComment: false, commentMsg: "" });

    let sessionID = this.props.sessionID;
    if (this.props.path !== "/") {
      //if this session exists already, update the entry in dynamoDB
      const url = ENDPOINT + "updateCommentCount/" + sessionID;

      axios.put(url).then(
        response => {
          // console.log(response);
        },
        error => {
          console.log(error);
        }
      );
    }
  };

  recieveComment = comment => {
    //recieve comment from other user and create toast
    this.props.addToast(comment);
    this.setState({ showComment: false, commentMsg: "" });
  };

  getCommentPopover = ({ ...props }) => (
    <Popover {...props} className="confused-popover">
      {this.state && this.state.selected ? (
        <Form onSubmit={this.handleComment}>
          <Form.Label>Enter your comment:</Form.Label>
          {this.state.commentError && (
            <Alert variant="danger">Please enter a comment.</Alert>
          )}
          <div className="comment-input">
            <Form.Control
              onChange={event => {
                this.setState({ commentMsg: event.target.value });
              }}
              size="md"
              type="text"
              // placeholder="briefly describe your confusion."
            ></Form.Control>
            <Button variant="primary" type="submit">
              <SendRounded />
            </Button>
          </div>
        </Form>
      ) : (
        <Alert variant="danger">
          Please first select the code you'd like to comment on.
        </Alert>
      )}
    </Popover>
  );

  basicSetState = stateChange => this.setState(stateChange);

  render() {
    const text = this.props.text;
    const isPilot = this.props.isPilot;
    return (
      <Container fluid className="left-side">
        <SplitPane
          //One side input, other side output, once we get app to run code?
          split="horizontal"
          minSize={0} //change to 50 to show the text desc
          maxSize={window.innerHeight * 0.8} //change to show text desc.
          defaultSize={0} //{200} //change to 200 to show text desc
          style={{ width: "100%" }}
          resizerStyle={{ border: 0 }} //{{ border: 10 }}
          pane1Style={{ color: "#ffffff", backgroundColor: "#43454d" }}
          pane2Style={
            this.state.annotations && this.state.annotations.length > 0
              ? { border: "5px solid red" }
              : {}
          }
        >
          <div className="problem-desc">
            {`
        put problem description here
        `}{" "}
          </div>
          <AceEditor
            id="editor"
            style={{ height: "100%", width: "100%" }}
            ref="editor"
            mode="python"
            theme="cobalt"
            fontSize={16}
            highlightActiveLine={false}
            onChange={this.handleChange}
            readOnly={!isPilot} //if user is not the pilot, editor is readOnly
            onCursorChange={this.handleChange}
            onSelectionChange={this.handleChange}
            name="UNIQUE_ID_OF_DIV"
            value={text}
            editorProps={{ $blockScrolling: true, $useWorker: false }}
            setOptions={{ useWorker: false }}
            markers={this.state.markers}
          />
        </SplitPane>
        <HoverClickPopover
          onHidePopover={() =>
            this.basicSetState({ confusedMsg: "", showConfused: false })
          }
          popover={this.getConfusedPopover}
          variant="danger"
          buttonClass="confused-btn"
          showPopover={this.state.showConfused} //to close the confused popover once submitted.
          hoverContent={
            <div>Click to ask your partner a question about the code</div>
          }
          onClick={() => this.setState({ showConfused: true })}
          buttonContent={<HelpOutlineRounded />}
          usePopoverStateOutside={true}
        />
        <HoverClickPopover
          onHidePopover={() =>
            this.basicSetState({ commentMsg: "", showComment: false })
          }
          popover={this.getCommentPopover}
          variant="warning"
          buttonClass="comment-btn"
          showPopover={this.state.showComment} //to close the confused popover once submitted.
          hoverContent={<div>Click to make a public comment on the code</div>}
          onClick={() => this.setState({ showComment: true })}
          buttonContent={<CommentRounded />}
          usePopoverStateOutside={true}
        />
        <OverlayTrigger
          trigger={["hover", "focus"]}
          overlay={<Tooltip>Run code</Tooltip>}
          placement="right"
        >
          <Button
            variant="success"
            className="run"
            onClick={this.props.handleRun}
          >
            <PlayArrowRounded />
          </Button>
        </OverlayTrigger>

        {this.state.annotations && this.state.annotations.length > 0 && (
          <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={<Tooltip>Resolve the question</Tooltip>}
            placement="right"
          >
            <Button
              variant="success"
              className="resolve-btn"
              onClick={() => {
                this.setState({ markers: [], annotations: [] }, () => {
                  var resolve = {
                    markers: this.state.markers,
                    annotations: this.state.annotations,
                    showConfused: false
                  };
                  this.props.packageMessage(resolve, "resolve");
                });
                this.session.setAnnotations([]);
              }}
            >
              <DoneRounded />
            </Button>
          </OverlayTrigger>
        )}
      </Container>
    );
  }
}

export default TextInput;
