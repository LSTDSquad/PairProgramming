import React from 'react';
import AceEditor from "react-ace";
import {AceMultiCursorManager, AceMultiSelectionManager} from "@convergencelabs/ace-collab-ext"
import {Range} from 'ace-builds/';

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
    
    this.editor1 = React.createRef(); //will reference Ace Editor
    this.curMgr = Object //empty cursor manager
    this.selMgr = Object


    }

  componentDidMount(){

    this.editor1 = this.refs.editor2.editor //set reference to ace editor
    
    this.curMgr = new AceMultiCursorManager(this.editor1.getSession()); //setup cursor manager in reference to editor
    this.curMgr.addCursor(this.props.userID, this.props.userID, "orange"); //add this window's curser to the cursor manager

    this.selMgr = new AceMultiSelectionManager(this.editor1.getSession());
    this.selMgr.addSelection(this.props.userID, this.props.userID, "orange");

  }

  componentDidUpdate() {

    //I think we should try to combine these two for loops...Maybe put selection and cursors in the same dictionary?

        // run this loop when other window changes, not when it itself changes
        // i.e cursors gets updated when message is sent
        for (const [key, value] of Object.entries(this.props.cursors)) {
            
            //if other window's cursor not in this instance of curMgr, add it
            if(Object.keys(this.curMgr._cursors).includes(key)==false){ 
              this.curMgr.addCursor(key, key, "blue");
              
            }

            //if another window updates, move their cursor
            if(key != this.props.userID){
              this.curMgr.setCursor(key, {row: value.row, column: value.column});

            }
        }  

        for (const [key, value] of Object.entries(this.props.selections)) {
            
            //if other window's cursor not in this instance of selMgr, add it
            if(Object.keys(this.selMgr._selections).includes(key)==false){ 
              this.selMgr.addSelection(key, key, "blue");
            }

            //if another window updates, update their selection
            if(key != this.props.userID){
              this.selMgr.setSelection(key, new Range(value.start.row, value.start.column, value.end.row, value.end.column));

            }
        }  
    }

  handleChange(e, event) {
    this.props.onTextChange(e);
  }

  handleCursorChange(e){

      const cursorPosition = e.getCursor();
      this.packageMessage(cursorPosition,'cursor')
  }

  handleSelectionChange(e,selection){
    const selectionRange = e.getRange();
    this.packageMessage(selectionRange);
    
  }

  packageMessage(what,type){

    const messageObj = {
          Who: this.props.userID,
          Type: type,
          What: what,
          When: new Date().valueOf()
        };

    this.props.onSendMessage(messageObj);
  }

  render(){
    const text = this.props.text;
    const side = this.props.side;
    const cursors = this.props.cursors
    return(
    <div>
      <AceEditor
          ref = {this.editor1}
          ref = "editor2"
          mode="python"
          theme="github"
          highlightActiveLine = {false}
          onChange={this.handleChange}
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