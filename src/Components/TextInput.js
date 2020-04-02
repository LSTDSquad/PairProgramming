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
  Row,
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
  DoneRounded
} from "@material-ui/icons";
// import ace from "react-ace";

import $ from "jquery";
// import MarkerPopup from './MarkerPopup'
// import ReactDOM from 'react-dom'
// const RANGE = ace.require('ace/range').Range;

class TextInput extends React.Component {
  //individual text boxes that send state to split view
  constructor(props) {
    // console.log(ace.edit('editor'));
    super(props);

    this.state = {
      selected: null,
      annotations: [],
      cursor: null,
      confusedMsg: "", //
      showConfused: false,
      markers: []
    };

    this.handleChange = this.handleChange.bind(this);
    // this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);

    this.state = { key: 0 }; // reference to key that was most recently pressed

    this.editor = React.createRef(); //will reference Ace Editor
    this.session = Object;
    this.doc = Object;
    this.curMgr = Object; //empty cursor manager
    this.selMgr = Object; //empty selection manager
    this.input = Object;
  }

  componentDidMount() {
    this.editor = this.refs.editor.editor; //set reference to ace editor
    // this.editor.renderer.$gutterLayer.$updateAnnotations = function(delta) {
    //   console.log(delta);
    //   if (!this.$annotations.length) return;
    //   var firstRow = delta.start.row;
    //   var len = delta.end.row - firstRow;
    //   if (len === 0) {
    //   } else if (delta.action == "remove") {
    //     this.$annotations.splice(firstRow, len + 1, null);
    //   } else {
    //     var args = new Array(len + 1);
    //     args.unshift(firstRow, 1);
    //     this.$annotations.splice.apply(this.$annotations, args);
    //   }
    // };

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
    this.selMgr.addSelection(this.props.userID, this.props.userID, "blue"); //add this window's selection to cursor manager
  }

  componentDidUpdate() {
    //
    //Should we try to combine these sets for loops?...Maybe put selection and cursors in the same dictionary?
    //

    for (const key of Object.keys(this.curMgr._cursors)) {
      //remove other user's cursors from previous session from the cursor manager on sessionID change
      if (Object.keys(this.props.cursors).includes(key) === false) {
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
        this.selMgr.addSelection(key, key, "blue");
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
    // Helper Methods ------------------------------------
    // Returns a string array containing the HTML making up an Ace marker
    // function getMarkerHTML(
    //   markerLayer,
    //   session,
    //   config,
    //   range,
    //   markerClass
    // ) {
    //   let stringBuilder = [];
    //   console.log(range)
    //   if (range.isMultiLine()) {
    //     // drawTextMarker is defined by ace's marker layer
    //     markerLayer.drawTextMarker(stringBuilder, range, markerClass, config);
    //   } else {
    //     // drawSingleLineMarker is defined by ace's marker layer
    //     console.log('RANGE', RANGE);
    //     console.log('Range', Range);
    //     markerLayer.drawSingleLineMarker(
    //       stringBuilder,
    //       range,
    //       `${markerClass} ace_start ace_br15`,
    //       config
    //     );
    //   }

    //   return stringBuilder;
    // }

    // // Defines a generic dynamicMarker update that renders a bootstrap popover on mouseenter
    // function customUpdateWithOverlay(
    //   markerClass,
    //   markerRange,
    //   overlayPlacement,
    //   overlayTitle,
    //   overlayContent,
    //   overrideWidth
    // ) {
    //   return (html, markerLayer, session, config) => {
    //     // Use the helper method above to get the marker's HTML as a string (how Ace normally does it)
    //     let markerHTML = getMarkerHTML(
    //       markerLayer,
    //       session,
    //       config,
    //       markerRange,
    //       markerClass
    //     );
    //     // Use jQuery to parse that HTML into an actual DOM element
    //     let markerElement = $.parseHTML(markerHTML.join(""))[0];
    //     // From here, we can manipulate the DOM element however we so choose
    //     // In this case, we use it as a root for ReactDOM and use
    //     // react-bootstrap components to render a popover
    //     ReactDOM.render(
    //       <MarkerPopup
    //         ref={popup => (this.popup = popup)}
    //         overlayTarget={markerElement}
    //         overlayPlacement={overlayPlacement}
    //       >
    //         <Popover
    //           placement={overlayPlacement}
    //           title={overlayTitle}
    //           style={overrideWidth ? { maxWidth: "100%" } : {}}
    //         >
    //           {overlayContent}
    //         </Popover>
    //       </MarkerPopup>,
    //       markerElement
    //     );
    //     $(markerElement).css("pointer-events", "auto");
    //     // Since we have the actual DOM element, we can bind event handlers to it
    //     $(markerElement).mouseenter(() => {
    //       this.popup.setState({ show: true });
    //     });

    //     // Finally we append the element to the marker layer's DOM as a child
    //     // Since the marker layer is now using insertAdjacentHTML with this
    //     // custom build, the child is retained
    //     markerLayer.element.appendChild(markerElement);
    //   };
    // }

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

    //ignore the cursor change events that emerge with typing...
    else if (event.type === "changeCursor") {
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
      console.log(selectionRange);
      setTimeout(() => this.setState({ selected: selectionRange }), 500);
      // console.log(selectionRange);
      // this.editor.session.addDynamicMarker({
      //   update: customUpdateWithOverlay('confused-marker', selectionRange, 'right', 'this is a popover', 'popover content', false)
      // });
      // let annotations = [{ row: 0, column: 2, text: "annot", type: "error" }];
      // //let nextAnnotations = [...annotations.filter(({ custom }) => !custom)];
      // if (this.editor) {
      //   console.log(this.session);
      //   this.session.$annotations = annotations;
      // }
      this.packageMessage(selectionRange, "selection");
    } else if (event.type === "changeSelection") {
    }

    //and instead use the cursor positions from the two event actions
    else {
      if (event.action === "insert") {
        var cursorPosition = event.end;
        this.packageMessage(cursorPosition, "cursor");
      } else if (event.action === "remove") {
        var cursorPosition = event.end;
        cursorPosition.column--;
        this.packageMessage(cursorPosition, "cursor");
      }

      this.props.onTextChange(e); //update text for everyone through state
      this.packageMessage(e, "text"); //synch text through pubnub
      //this.packageMessage(this.props.sessionID, 'textUpdate');} //use this line to synch text via dynamoDB pulls
    }
  }

  // handleSelectionChange(e, selection) {
  //   const selectionRange = e.getRange();
  //   //this.packageMessage(selectionRange, "selection");
  // }

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

    if (sessionID !== "unsaved") {
      //if this session exists already, update the entry in dynamoDB
      const url =
        "https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateData/" +
        sessionID;
      console.log(url);

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

  setAnnotations = annots => {
    console.log('annots', annots);
    console.log('state', this.state.annotations)
    //let annotations = [{ row: 0, column: 2, text: "annot", type: "error" }];
    //let nextAnnotations = [...annotations.filter(({ custom }) => !custom)];
    if (this.editor && this.session.$annotations != this.state.annotations) {
      console.log(this.state.annotations);
      let currAnnotations = this.state.annotations || [];
      // this.session.setAnnotations([...currAnnotations]);
      //this.session.$annotations = annotations;
    }
  };

  handleConfused = event => {
    event.preventDefault();
    console.log(event);
    //console.log(this.state.selected)
    //this.state.selected is in this form: {start: {row:, column:}, end{row:, column:}}
    //let currAnnotations = this.session.$annotations;
    let currAnnotations = this.state.annotations || [];
    let markers = this.state.markers || [];
    //console.log(currAnnotations);
    let { start, end } = this.state.selected;
    console.log("start", start);
    console.log("end", end);
    // this.session.setAnnotations([...currAnnotations, {row: start.row, html: '<button>new annot </button>', type: 'warning'}])
    this.session.setAnnotations([
      ...currAnnotations,
      {
        row: start.row,
        html: `<div>${this.state.confusedMsg}</div>`,
        type: "error"
      }
    ]);
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
        {/* <Popover.Title as='h4'>Briefly describe your confusion</Popover.Title> */}
        {/* <Popover.Content> */}
        {this.state && this.state.selected ? (
          <Form onSubmit={this.handleConfused}>
            <Form.Label>Briefly describe your confusion.</Form.Label>
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

  render() {
    const text = this.props.text;
    const isPilot = this.props.isPilot;
    return (
      <Container fluid className="left-side">
        <SplitPane
          //One side input, other side output, once we get app to run code?
          split="horizontal"
          minSize={50}
          maxSize={window.innerHeight * 0.8}
          defaultSize={100}
          style={{ width: "100%" }}
          resizerStyle={{ border: 10 }}
        >
          {/* <Row style={{height: 100}}> */}
          <div className="problem-desc">
            {`
        Some dank problems for you to solve
        
        woohoo yeah
        `}{" "}
          </div>
          {/* </Row> */}
          {/* <Row style={{ height: "100%", whiteSpace: 'nowrap'}}> */}
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
            //annotations={[{ row: 0, column: 2, html: '<button>this is a button </button>', type: 'warning'}, { row: 0, column: 2, text: 'another one', type: 'warning'}]} //types: info, warning, error
          />
        </SplitPane>
        {/* </Row> */}
        {!this.props.isPilot && (
          <OverlayTrigger
            trigger={["click"]}
            placement="top"
            overlay={this.getConfusedPopover()}
            rootClose={true}
            onHide={() =>
              this.setState({ confusedMsg: "", showConfused: false })
            }
          >
            <Button
              onClick={() => this.setState({ showConfused: true })}
              variant="danger"
              className="confused-btn"
            >
              <HelpOutlineRounded />
            </Button>
          </OverlayTrigger>
        )}
        <Button className="run" onClick={this.props.handleRun}>
          {" "}
          <PlayArrowRounded />
        </Button>
        {this.props.isPilot &&
          this.state.annotations &&
          this.state.annotations.length > 0 && (
            <Button
              variant="success"
              className="resolve-btn"
              onClick={() => {
                this.setState({ markers: [], annotations: [] });
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
