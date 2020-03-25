import React from 'react';
import AceEditor from "react-ace";
import {AceMultiCursorManager, AceMultiSelectionManager} from "@convergencelabs/ace-collab-ext"
import {Range} from 'ace-builds/';
import axios from 'axios';

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "@convergencelabs/ace-collab-ext/css/ace-collab-ext.css";


class TextInput extends React.Component{
  //individual text boxes that send state to split view
  constructor(props) {

    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleCursorChange = this.handleCursorChange.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    
    this.editor = React.createRef(); //will reference Ace Editor
    this.curMgr = Object //empty cursor manager
    this.selMgr = Object //empty selection manager

    }

  componentDidMount(){

    this.editor = this.refs.editor.editor //set reference to ace editor
    
    this.curMgr = new AceMultiCursorManager(this.editor.getSession()); //setup cursor manager in reference to editor
    this.curMgr.addCursor(this.props.userID, this.props.userID, "orange"); //add this window's curser to the cursor manager

    this.selMgr = new AceMultiSelectionManager(this.editor.getSession()); //setup selection manager in reference to editor
    this.selMgr.addSelection(this.props.userID, this.props.userID, "blue"); //add this window's selection to cursor manager

  }

  componentDidUpdate() {
    //
    //Should we try to combine these sets for loops?...Maybe put selection and cursors in the same dictionary?
    //

        for(const key of Object.keys(this.curMgr._cursors)){
          //remove other user's cursors from previous session from the cursor manager on sessionID change
          if(Object.keys(this.props.cursors).includes(key)===false){
            this.curMgr.removeCursor(key);
          }
        }

        for(const key of Object.keys(this.selMgr._selections)){
          //remove other user's selection from previous session from the selection manager on sessionID change
          if(Object.keys(this.props.selections).includes(key)===false){
            this.selMgr.removeSelection(key);
          }
        }

        // run this loop when other window changes, not when it itself changes
        // i.e cursors gets updated when message is sent
        for (const [key, value] of Object.entries(this.props.cursors)) {
            
            //if another user's cursor not in this of cursor manager, add it
            if(Object.keys(this.curMgr._cursors).includes(key)===false){
              this.curMgr.addCursor(key, key, "orange");
            }

            //if another user updates their cursor another window, move their cursor on this window
            if(key !== this.props.userID){
              this.curMgr.setCursor(key, {row: value.row, column: value.column});

            }
        }  

        for (const [key, value] of Object.entries(this.props.selections)) {
            
            //if another user's selection not in this selection manager, add it
            if(Object.keys(this.selMgr._selections).includes(key)===false){ 
              this.selMgr.addSelection(key, key, "blue");
            }

            //if another user updates their selection another window, move their selection on this window
            if(key !== this.props.userID){
              this.selMgr.setSelection(key, new Range(value.start.row, value.start.column, value.end.row, value.end.column));

            }
        }  
    }

  handleChange(e, event) {

      console.log(e, event.action);
      this.props.onTextChange(e);
      this.packageMessage(e,'text');
      //this.handleTextChange(e)
     
    
  }

  handleCursorChange(e){
      const cursorPosition = e.getCursor();
      this.packageMessage(cursorPosition,'cursor')
  }

  handleSelectionChange(e,selection){
    const selectionRange = e.getRange();
    this.packageMessage(selectionRange, "selection");
  }

  packageMessage(what,type){
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

    handleTextChange(e){

        //uses session ID from props to either update backend or create new table entry

      let data = e;
      let sessionID = this.props.sessionID;
      console.log(this.props.sessionID, sessionID)


      if(sessionID==='unsaved'){
            //if this is a new session, write new session to dynamoDB
        const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/setData'

        axios.post(url, data)
          .then(response => {
            const message = response.data;
            console.log(message);
          },(error) => {
            console.log(error);
          });
      }
      else{
            //if this session exists already, update the entry in dynamoDB
        const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateData/'+sessionID
        
        axios.put(url,data)
          .then(response => {
            const message = response.data;
            console.log(message)},
          (error) => {
            console.log(error);
            }
          );
      }
    }

  render(){
    const text = this.props.text;
    const isPilot = this.props.isPilot
    return(
    <div>
      <AceEditor
          ref = "editor"
          mode="python"
          theme="github"
          highlightActiveLine = {false}
          onChange={this.handleChange}
          readOnly = {!isPilot} //if user is not the pilot, editor is readOnly
          onCursorChange={this.handleCursorChange}
          onSelectionChange = {this.handleSelectionChange}
          name="UNIQUE_ID_OF_DIV"
          value = {text}
          editorProps={{ $blockScrolling: true }}
        />
      </div>   
    );
  }
}

export default TextInput