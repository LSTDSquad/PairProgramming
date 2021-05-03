import React, { useState, useEffect, useRef } from "react";
import AceEditor from "react-ace";
import {
  AceMultiCursorManager,
  AceMultiSelectionManager
} from "@convergencelabs/ace-collab-ext";
import { Range } from "ace-builds/"; //took out Range
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-gruvbox";
import "@convergencelabs/ace-collab-ext/css/ace-collab-ext.css";
import {
  Container,
} from "react-bootstrap";
import "./TextInput.css";
import SplitPane from "react-split-pane";
import { apiGetCall, apiPutCall } from "../../endpoints";
import { RunOrStopButton, CommentButton, ConfusedButton, ResolveButton } from "./ProgramButtons";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function areDifferentPositions(one, two) {
  if (!one || !two) return false;
  if (one.row !== two.row) return true;
  if (one.column !== two.column) return true;
  return false;
}


/*
Props:
cursors: in the form {10392: cursorPositionObject, }
<TextInput
  side="left"
  isPilot={isPilot}
  sessionID={sessionID}
  userID={userID}
  handleRun={this.runCode}
  addToast={this.addToast}
  user_name={this.state.user_name}
  packageMessage={this.packageMessage}
  isRunningCode={this.state.isRunningCode}
  pubnub={this.PubNub}
  handleInterrupt={this.handleInterrupt} // to stop code
/>

*/
function TextInput({ isPilot, sessionID, userID, pubnub, setEditorRef,
  handleRun, addToast, user_name, packageMessage, isRunningCode, handleInterrupt }) {
  const editorRef = useRef(); //set reference to ace editor

  let [text, setText] = useState("");
  //individual text boxes that send state to split view

  //selection, used for processing comments and confusions
  let mySelected = useRef({ start: { row: 0, column: 0 }, end: { row: 0, column: 0 } });
  let session = useRef(null);
  let curMgr = useRef(null); //cursor manager for the other cursors
  let selMgr = useRef(null); //selection manager for the other people's selections.


  /**
   * fires whenever cursor changes (includes when you're typing in the editor)
   */
  function handleMyCursorChange() {
    const { cursor, anchor } = editorRef.current.editor.getSelection();
    const { row: currRow, column: currColumn } = cursor;
    const { row: anchorRow, column: anchorColumn } = anchor;
    /**
     * returns null if there is nothing selected
     */
    function getSelection() {
      function isForwards() {
        if (anchorRow < currRow) return true;
        if (anchorRow > currRow) return false;
        return (anchorColumn < currColumn);
      }
      //if there is nothing selected:
      if (anchorRow === currRow && anchorColumn === currColumn) return null;
      const isInOrder = isForwards();
      const start = isInOrder ? anchor : cursor;
      const end = isInOrder ? cursor : anchor;
      return { start, end };
    }
    mySelected.current = getSelection() || {start: {row: currRow, column: currColumn}, end: {row: currRow, column: currColumn}};
    pubnub.setState({
      state: { cursor: { row: currRow, column: currColumn }, selection: mySelected.current, UserName: user_name },
      channels: [sessionID],
    }, function (status, response) {
      if (status.isError) {
        console.log(status);
      }
    });
  }

  //only happens on mount. 
  useEffect(() => {
    if (editorRef.current.editor === null) {
      return;
    }
    setEditorRef(editorRef);
    session.current = editorRef.current.editor.getSession();
    curMgr.current = new AceMultiCursorManager(session.current); //setup cursor manager in reference to editor
    selMgr.current = new AceMultiSelectionManager(session.current); //setup selection manager in reference to editor
    session.current.$useWorker = false;

    const defaultText = "def main():\n\tpass \n\nif __name__ == '__main__':\n\tmain()";
    //get the previously saved session's code.
    apiGetCall("getData/" + sessionID, response => {
      let startText = response.data;
      if (startText === '') {
        startText = defaultText;
      }
      setText(startText);
    }, () => setText(defaultText));

    pubnub.addListener({
      message: ({ channel, message: { Who, Type, What, UserName } }) => {

        if (session && Who !== userID) {
          if (Type === "resolve") {
            // setResolve (What); //is this even needed????? 
            //remove confusion markers if props update with resolved confusion
            session.current.setAnnotations([]); //not necessary 
            setAnnotations([]);
            setMarkers([]);
          } else if (Type === "comment") {
            addToast(What);
          } else if (Type === "confused") {
            //message.What contains {selected, confusedMsg}
            receiveConfused(What);
          } else if (Type === "text") {
            setText(What);

          }
        }
      },

      presence: ({ action, state, uuid }) => {

        // clean up cursors if they leave.
        if (action === 'leave') {
          curMgr.current.removeCursor(uuid);
          selMgr.current.removeSelection(uuid);
        } else if (action === 'state-change' && uuid !== userID) {
          const { UserName, cursor, selection } = state;
          if (!UserName) return;

          function updateCursor() {
            if (!curMgr.current._cursors[uuid]) {
              curMgr.current.addCursor(uuid, UserName, "orange", cursor);

            }
            //if another user updates their cursor in another window,
            else {
              // //and there's a new position that is different from what we have on our window,
              //move their cursor on this window
              curMgr.current.setCursor(uuid, cursor);
            }
          }

          function updateSelection() {
            const range = new Range(
              selection.start.row,
              selection.start.column,
              selection.end.row,
              selection.end.column
            );
            //if another user's selection not in this selection manager, add it
            if (!selMgr.current._selections[uuid]) {
              selMgr.current.addSelection(uuid, UserName, "orange", [range]);
            }
            //if another user updates their selection another window, move their selection on this window
            else {
              selMgr.current.setSelection(
                uuid,
                [range] //must be array 
              );
            }
          }

          updateCursor();

          if (selection) {
            updateSelection();
          }

        }
      }
    });


    // ADD LISTENERS
    //add keyboard listener to ace editor to record which key was pressed
    //for filtering out the cursorChange noise
    //might not need this.

    const ace_div = document.getElementById("UNIQUE_ID_OF_DIV");
    ace_div.onmouseup = () => {
      handleMyCursorChange();
    };
    ace_div.onkeyup = (e) => {
      handleMyCursorChange();
      const currText = editorRef.current.editor.getValue();
      //for some reason, in here, text is always ""
      setText(currText);
      handleTextChange(currText);
    }
  }, [])


  //must keep track of annotations in state in case there's multiple annotaitons

  let [annotations, setAnnotations] = useState([]);
  let [markers, setMarkers] = useState([]);

  function handleTextChange(text) {
    packageMessage(text, "text");
    //uses session ID from props to either update backend
    let data = { text };
    //if this session exists already, update the entry in dynamoDB
    apiPutCall("updateData/" + sessionID, data, _ => {}, error => console.log(error));

    let editTimestamp = { timestamp: String(new Date()) };
    apiPutCall("updateLastEdit/" + sessionID, editTimestamp);
  }

  const announceConfused = (confusedMsg) => {
    //selected is in this form: {start: {row:, column:}, end{row:, column:}}

    processConfused(mySelected.current, confusedMsg);
    let { end } = mySelected.current;
    mySelected.current.start.column = 0;
    mySelected.current.end = { row: end.row + 1, column: 0 };
    packageMessage({ selected: mySelected.current, confusedMsg }, "confused");

    //if this session exists already, update the entry in dynamoDB
    apiPutCall("updateConfusionCount/" + sessionID);

  }

  function selectionToCode({ start, end }) {
    return editorRef.current.editor.selection.doc.$lines.slice(start.row, end.row + 1);
  }

  const processConfused = (selected, confusedMsg) => {

    let { start, end } = selected;
    selected.start.column = 0;
    selected.end = { row: end.row, column: 0 };
    //update other users window when question is asked
    let currAnnotations = annotations || [];
    session.current.setAnnotations([
      ...currAnnotations,
      {
        row: start.row,
        html: `<div>${confusedMsg}</div>`,
        type: "error"
      }
    ]);
    let newToast = {
      code: selectionToCode(selected),
      type: "confused",
      msg: confusedMsg,
      show: true,
      ...selected
    };
    addToast(newToast);
    setAnnotations([...annotations, {
      row: start.row,
      html: `<div>${confusedMsg}</div>`,
      type: "error"
    }]);
    setMarkers([...markers, {
      startRow: start.row,
      endRow: end.row,
      startCol: start.column,
      endCol: end.column,
      className: `confused-marker`,
      type: "text"
    }]);

  };

  const receiveConfused = ({ selected, confusedMsg }) => {
    //confusionStatus contains selected, confusedMsg
    console.log("receiving confused", selected, confusedMsg);
    processConfused(selected, confusedMsg);
  };

  const announceComment = (commentMsg) => {
    let newToast = {
      code: selectionToCode(mySelected.current),
      type: "comment",
      msg: commentMsg,
      show: true,
      ...mySelected.current
    };
    packageMessage(newToast, "comment");
    addToast(newToast);

    //if this session exists already, update the entry in dynamoDB
    apiPutCall("updateCommentCount/" + sessionID);
  }

  const handleResolve = () => {
    setMarkers([]);
    setAnnotations([]);
    var resolve = {
      markers,
      annotations,
      showConfused: false
    };
    packageMessage(resolve, "resolve");
    session.current.setAnnotations([]);
  }

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
          annotations && annotations.length > 0
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
          ref={editorRef}
          mode="python"
          theme="gruvbox"
          fontSize={16}
          highlightActiveLine={true}
          readOnly={!isPilot} //if user is not the pilot, editor is readOnly
          name="UNIQUE_ID_OF_DIV"
          value={text}
          editorProps={{ $blockScrolling: true, $useWorker: false }}
          setOptions={{ useWorker: false }}
          markers={markers}
          debounceChangePeriod={200} //in milliseconds.
        />
      </SplitPane>
      {annotations && annotations.length > 0 &&
        <ResolveButton handleResolve={handleResolve} />}
      <CommentButton
        selected={mySelected.current}
        announceComment={announceComment} />

      <ConfusedButton
        selected={mySelected.current}
        announceConfused={announceConfused}
      />

      <RunOrStopButton handleInterrupt={handleInterrupt}
        isRunningCode={isRunningCode}
        handleRun={handleRun} />
    </Container>
  );
}

export default TextInput;
