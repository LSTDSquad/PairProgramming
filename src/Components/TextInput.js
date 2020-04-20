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
  Form
} from "react-bootstrap";
import "./CSS/TextInput.css";
import SplitPane from "react-split-pane";
import {
  PlayArrowRounded,
  SendRounded,
  HelpOutlineRounded,
  DoneRounded,
  CommentRounded
} from "@material-ui/icons";

import $ from "jquery";

class TextInput extends React.Component {
  //individual text boxes that send state to split view
  constructor(props) {
    super(props);

    this.state = {
      selected: null,
      annotations: [],
      cursor: null,
      confusedMsg: "", //
      markers: [],
      commentMsg: "",
      toasts: [],
      showConfused: false,
      showComment: false,
      commentError: false,
      confusedError: false,
      key: 0 // reference to key that was most recently pressed
    };

    this.handleChange = this.handleChange.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);

    this.editor = React.createRef(); //will reference Ace Editor
    this.session = Object;
    this.doc = Object;
    this.curMgr = Object; //empty cursor manager
    this.selMgr = Object; //empty selection manager
    this.input = Object;
  }

  componentDidMount() {
    this.editor = this.refs.editor.editor; //set reference to ace editor

    this.session = this.editor.getSession();
    this.session.$useWorker = false;
    this.doc = this.session.getDocument();

    this.input = this.editor.textInput.getElement();
    this.input.addEventListener("keydown", this.handleKey);
    this.input.addEventListener("onclick", this.handleClick);

    let currentComponent = this;

    //add keyboard listener to ace editor to record which key was pressed
    this.editor.keyBinding.addKeyboardHandler(function(
      data,
      hashId,
      keyString,
      keyCode,
      e
    ) {
      currentComponent.setState({ key: keyCode });
    });

    this.curMgr = new AceMultiCursorManager(this.session); //setup cursor manager in reference to editor
    this.curMgr.addCursor(this.props.userID, this.props.userID, "orange"); //add this window's curser to the cursor manager

    this.selMgr = new AceMultiSelectionManager(this.editor.getSession()); //setup selection manager in reference to editor

    this.selMgr.addSelection(this.props.userID, this.props.userID, "yellow"); //add this window's selection to cursor manager
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
    //
    //Should we try to combine these sets for loops?...Maybe put selection and cursors in the same dictionary?
    //

    if (prevState.confusionStatus !== this.props.confusionStatus) {
      //add confusion markers if props update with confusion
      this.receiveConfused();
    }

    if (prevState.resolve !== this.props.resolve) {
      //remove confusion markers if props update with resolved confusion
      this.session.setAnnotations([]);
      this.setState({ annotations: [] });
      //console.log(this.state.markers)
      this.setState({ markers: [] });
      
    }

    for (const key of Object.keys(this.curMgr._cursors)) {
         // console.log(this.props.cursors,key,Object.keys(this.props.cursors).includes(key) === false)

      //remove other user's cursors from previous session from the cursor manager on sessionID change
      if (Object.keys(this.props.cursors).includes(key) === false) {
        console.log("removed cursor")
        this.curMgr.removeCursor(key);
      }
    }

    for (const key of Object.keys(this.selMgr._selections)) {
      //remove other user's selection from previous session from the selection manager on sessionID change
      if (Object.keys(this.props.selections).includes(key) === false) {
        this.selMgr.removeSelection(key);
      }
    }

    // run this loop when other window changes, not when it itself changes
    // i.e cursors gets updated when message is sent
    for (const [key, value] of Object.entries(this.props.cursors)) {
      //if another user's cursor not in this of cursor manager, add it
      if (Object.keys(this.curMgr._cursors).includes(key) === false) {
        this.curMgr.addCursor(key, key, "orange");
      }

      //if another user updates their cursor another window, move their cursor on this window
      if (key !== this.props.userID) {
        this.curMgr.setCursor(key, { row: value.row, column: value.column });
      }
    }

    for (const [key, value] of Object.entries(this.props.selections)) {
      //if another user's selection not in this selection manager, add it
      if (Object.keys(this.selMgr._selections).includes(key) === false) {

        this.selMgr.addSelection(key, key, "yellow");

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

  selectionToCode(sel) {
    const { start, end } = sel.getRange();
    return sel.doc.$lines.slice(start.row, end.row + 1);
  }

  handleChange(e, event) {

    //If the cursor changes due to arrow key movement
    // 37-40 are the key codes corresponding to arrow keys
    // 0 corresponds to mouse click
    if (
      event.type === "changeCursor" &&
      (this.state.key === 37 ||
        this.state.key === 38 ||
        this.state.key === 39 ||
        this.state.key === 40 ||
        this.state.key === 0)
    ) {
      var cursorPosition = e.getCursor();
      this.packageMessage(cursorPosition, "cursor");
    }

    //only send selection messages after mouseclick or typing, not with every change in text
    else if (
      event.type === "changeSelection" &&
      (this.state.key === 0 ||
        this.state.key === undefined ||
        this.state.key === 37 ||
        this.state.key === 38 ||
        this.state.key === 39 ||
        this.state.key === 40)
    ) {
      const selectionRange = e.getRange();
      let {start, end} = selectionRange;
      if (end.row > start.row || end.column > start.column) {
        selectionRange.code = this.selectionToCode(e);
        setTimeout(() => this.setState({ selected: selectionRange }), 500);
      } else {
        setTimeout(() => this.setState({ selected: null }), 500);
      }
      
      this.packageMessage(selectionRange, "selection");
    } 

    //ignore the cursor change events that emerge with typing...
    //and instead use the cursor positions from the two event actions
    else if (event.action === "insert" || event.action === "remove"){
      if (event.action === "insert") {
        var cursorPosition = event.end;
        this.packageMessage(cursorPosition, "cursor");
      } else if (event.action === "remove") {
        var cursorPosition = event.end;
        cursorPosition.column--;
        this.packageMessage(cursorPosition, "cursor");
      }

      this.props.onTextChange(e); //update text for this through state
      this.packageMessage(e, "text"); //synch text through pubnub
      this.handleTextChange(e); //save updated text to dynamoDB
    }
  }

  packageMessage(what, type) {
    //package either cursor or selection change into message
    //object and send it in SplitText.js sendMessage function
    const messageObj = {
      Who: this.props.userID,
      Type: type,
      What: what,
      When: new Date().valueOf()
    };

    this.props.onSendMessage(messageObj);
  }

  handleTextChange(e) {
    //uses session ID from props to either update backend
    let data = { text: this.props.text };
    let sessionID = this.props.sessionID;
    if (this.props.path != "/") {
      //if this session exists already, update the entry in dynamoDB
      const url =
        "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateData/" +
        sessionID;
      console.log(url);

      axios.put(url, data).then(
        response => {
          console.log(response);
          const message = response.data;
          console.log(message);
        },
        error => {
          console.log(error);
        }
      );
    }
  }

  // setAnnotations = annots => {
  //   if (this.editor && this.session.$annotations != this.state.annotations) {
  //     console.log(this.state.annotations);
  //     let currAnnotations = this.state.annotations || [];
  //     // this.session.setAnnotations([...currAnnotations]);
  //     //this.session.$annotations = annotations;
  //   }
  // };

  handleConfused = event => {
    event.preventDefault();
    if (!/\S/.test(this.state.confusedMsg)) {
      //only white space
      this.setState({confusedError: true});
      return;
    }
    this.setState({confusedError: false});
    //this.state.selected is in this form: {start: {row:, column:}, end{row:, column:}}
    //let currAnnotations = this.session.$annotations;
    let currAnnotations = this.state.annotations || [];
    let markers = this.state.markers || [];
    //console.log(currAnnotations);
    let { start, end } = this.state.selected;
    console.log("start", start);
    console.log("end", end);
    // this.session.setAnnotations([
    //   ...currAnnotations,
    //   {
    //     row: start.row,
    //     html: `<div>${this.state.confusedMsg}</div>`,
    //     type: "error"
    //   }
    // ]);
    let newToast = {
      type: "confused",
      msg: this.state.confusedMsg,
      show: true,
      ...this.state.selected
    };
    this.props.addToast(newToast);
    
    this.setState({
      annotations: [
        ...currAnnotations,
        {
          row: start.row,
          html: `<div>${this.state.confusedMsg}</div>`,
          type: "error"
        }
      ],
      showConfused: false,
      confusedMsg: '',
      markers: [
        ...markers,
        {
          startRow: start.row,
          endRow: end.row,
          startCol: start.column,
          endCol: end.column,
          className: `confused-marker`,
          type: "background"
        }
      ]
    });
    this.packageMessage(this.state, "confused");

    let sessionID = this.props.sessionID;
                if (this.props.path != "/") {
                  //if this session exists already, update the entry in dynamoDB
                  const url =
                    "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateConfusionCount/" +
                    sessionID;

                  axios.put(url).then(
                    response => {
                      console.log(response);
                      const message = response.data;
                      console.log(message);
                    },
                    error => {
                      console.log(error);
                    }
                  );
                }
  };

  receiveConfused = () => {
    //update other users window when question is asked
    let currAnnotations = this.state.annotations || [];
    let markers = this.state.markers || [];
    console.log(this.props.confusionStatus);
    let { start, end } = this.props.confusionStatus.selected;
    this.session.setAnnotations([
      ...currAnnotations,
      {
        row: start.row,
        html: `<div>${this.props.confusionStatus.confusedMsg}</div>`,
        type: "error"
      }
    ]);
    let newToast = {
      type: "confused",
      msg: this.props.confusionStatus.confusedMsg,
      show: true,
      ...this.props.confusionStatus.selected
    };
    this.props.addToast(newToast);
    this.setState({
      annotations: [
        ...currAnnotations,
        {
          row: start.row,
          html: `<div>${this.props.confusionStatus.confusedMsg}</div>`,
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
          type: "background"
        }
      ]
    });
  };

  getConfusedPopover = () =>
    this.state.showConfused ? (
      <Popover className="confused-popover">
        {this.state && this.state.selected ? (
          <Form onSubmit={this.handleConfused}>
            <Form.Label>Briefly describe your confusion.</Form.Label>
            {this.state.confusedError  && <Alert variant="danger">
            Please enter a note.
          </Alert>}
            <Form.Control
              onChange={event => {
                this.setState({ confusedMsg: event.target.value });
              }}
              size="sm"
              type="text"
              // placeholder="briefly describe your confusion."
            ></Form.Control>
            <Button variant="primary" type="submit">
              <SendRounded />
            </Button>
          </Form>
        ) : (
          <Alert variant="danger">
            Please first select the code you're confused about.
          </Alert>
        )}
      </Popover>
    ) : (
      <span />
    );

  handleComment = event => {
    event.preventDefault();
    if (!/\S/.test(this.state.commentMsg)) {
      //only white space
      this.setState({commentError: true});
      return;
    }
    this.setState({commentError: false});
    //TODO: SEND TO THE BACKEND.
    console.log(this.state.selected);
    // let { start, end } = this.state.selected;
    let newToast = {
      type: "comment",
      msg: this.state.commentMsg,
      show: true,
      ...this.state.selected
    };
    this.props.addToast(newToast);
    this.setState({ showComment: false, commentMsg: '' });
    // console.log(this.state.toasts);

    let sessionID = this.props.sessionID;
                if (this.props.path != "/") {
                  //if this session exists already, update the entry in dynamoDB
                  const url =
                    "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateCommentCount/" +
                    sessionID;

                  axios.put(url).then(
                    response => {
                      console.log(response);
                      const message = response.data;
                      console.log(message);
                    },
                    error => {
                      console.log(error);
                    }
                  );
                }

  };

  getCommentPopover = () =>
    this.state.showComment ? (
      <Popover className="confused-popover">
        {this.state && this.state.selected ? (
          <Form onSubmit={this.handleComment}>
            <Form.Label>Enter your comment:</Form.Label>
            {this.state.commentError  && <Alert variant="danger">
            Please enter a comment. 
          </Alert>}
            <Form.Control
              onChange={event => {
                this.setState({ commentMsg: event.target.value });
              }}
              size="sm"
              type="text"
              // placeholder="briefly describe your confusion."
            ></Form.Control>
            <Button variant="primary" type="submit">
              <SendRounded />
            </Button>
          </Form>
        ) : (
          <Alert variant="danger">
            Please first select the code you'd like to comment on.
          </Alert>
        )}
      </Popover>
    ) : (
      <span />
    );

  render() {
    const text = this.props.text;
    const isPilot = this.props.isPilot;
    return (
      <Container fluid className="left-side">
        <SplitPane
          //One side input, other side output, once we get app to run code?
          split="horizontal"
          minSize={0} //change to 50 to show the text desc
          maxSize={0} //{window.innerHeight * 0.8}   //change to show text desc.
          defaultSize={0} //change to 200 to show text desc
          style={{ width: "100%" }}
          resizerStyle={{ border: 0 }} //{{ border: 10 }}
          pane1Style={{ color: "#ffffff", backgroundColor: "#170a30" }}
          pane2Style={
            this.state.annotations && this.state.annotations.length > 0
              ? { border: "5px solid red" }
              : {}
          }
        >
          <div className="problem-desc">
            {`
        Some dank problems for you to solve
        
        woohoo yeah
        `}{" "}
          </div>
          <AceEditor
            id="editor"
            style={{ height: "100%", width: "100%" }}
            ref="editor"
            mode="python"
            theme="cobalt"
            highlightActiveLine={false}
            onChange={this.handleChange}
            readOnly={!isPilot} //if user is not the pilot, editor is readOnly
            onCursorChange={this.handleChange}
            onSelectionChange={this.handleChange}
            name="UNIQUE_ID_OF_DIV"
            value={text}
            //onValidate={this.setAnnotations}
            editorProps={{ $blockScrolling: true, $useWorker: false }}
            setOptions={{ useWorker: false }}
            //onCursorChange={} //sel.cursor.row, sel.cursor.col
            //markers={[{startRow:0, endRow: 1, className: `confused-marker`, type: 'selection'}]}
            markers={this.state.markers}
            //annotations can either have html or text.
            //annotations={this.state.annotations}
          />
        </SplitPane>
        <OverlayTrigger
          trigger={"click"}
          placement="right"
          overlay={this.getConfusedPopover()}
          rootClose={true}
          onHide={() => this.setState({ confusedMsg: "" })}
        >
          <Button
            variant="danger"
            className="confused-btn"
            onClick={() => this.setState({ showConfused: true })}
          >
            <HelpOutlineRounded />
          </Button>
        </OverlayTrigger>
        {/* <OverlayTrigger
          trigger={"click"}
          placement="top"
          overlay={this.getCommentPopover()}
          rootClose={true}
          onHide={() => this.setState({ commentMsg: "" })}
        >
          <Button
            variant="warning"
            onClick={() => this.setState({ showComment: true })}
            className="comment-btn"
          >
            <CommentRounded />
          </Button>
        </OverlayTrigger> */}
        <Button
          variant="success"
          className="run"
          onClick={this.props.handleRun}
        >
          <PlayArrowRounded />
        </Button>
        {
          this.state.annotations &&
          this.state.annotations.length > 0 && (
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
                  this.packageMessage(resolve, "resolve");
                });
                this.session.setAnnotations([]);

              }}
            >
              <DoneRounded />
            </Button>
          )}
      </Container>
    );
  }
}

export default TextInput;
