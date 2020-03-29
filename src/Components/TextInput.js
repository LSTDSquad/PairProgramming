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
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.packageMessage = this.packageMessage.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);

    this.state = {key: 0} // reference to key that was most recently pressed
    
    this.editor = React.createRef(); //will reference Ace Editor
    this.session = Object;
    this.doc = Object;
    this.curMgr = Object //empty cursor manager
    this.selMgr = Object //empty selection manager
    this.input = Object

    }

  componentDidMount(){

    this.editor = this.refs.editor.editor //set reference to ace editor
    this.session = this.editor.getSession();
    this.doc = this.session.getDocument();

    this.input = this.editor.textInput.getElement()
    this.input.addEventListener('keydown', this.handleKey);
    this.input.addEventListener('onclick', this.handleClick);

    let currentComponent = this;

    //add keyboard listener to ace editor to record which key was pressed
    this.editor.keyBinding.addKeyboardHandler(function(data, hashId, keyString, keyCode, e) {
       console.log(data, hashId, keyString, keyCode, e);
       currentComponent.setState({key: keyCode});
      })

    this.curMgr = new AceMultiCursorManager(this.session); //setup cursor manager in reference to editor
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

    console.log(this.state.key);

    //If the cursor changes due to arrow key movement
    // 37-40 are the key codes corresponding to arrow keys
    // 0 corresponds to mouse click
    if(event.type === "changeCursor" && 
      (this.state.key === 37 ||
       this.state.key === 38 ||
       this.state.key === 39 ||
       this.state.key === 40 ||
       this.state.key === 0)){

          var cursorPosition = e.getCursor()
          this.packageMessage(cursorPosition,'cursor')
      }

    //ignore the cursor change events that emerge with typing...
    else if (event.type === "changeCursor"){
      }

    //only send selection messages after mouseclick or typing, not with every change in text
    else if (event.type ==="changeSelection" && 
      (this.state.key === 0 || 
       this.state.key === undefined ||
       this.state.key === 37 ||
       this.state.key === 38 ||
       this.state.key === 39 ||
       this.state.key === 40 )){
      console.log('hi',e, e.getRange());
      const selectionRange = e.getRange();
      this.packageMessage(selectionRange, "selection");
    }

     else if (event.type === "changeSelection"){
      }

   //and instead use the cursor positions from the two event actions
    else{
        if(event.action === "insert"){
            var cursorPosition = event.end
            this.packageMessage(cursorPosition,'cursor');
        }

        else if(event.action === "remove"){
            var cursorPosition = event.end
            cursorPosition.column --
            this.packageMessage(cursorPosition,'cursor');
        }

         this.props.onTextChange(e); //update text for everyone through state
         this.packageMessage(e,'text'); //synch text through pubnub
         //this.packageMessage(this.props.sessionID, 'textUpdate');} //use this line to synch text via dynamoDB pulls
      }
  }

  handleSelectionChange(e,selection){
    console.log('hi',e, e.getRange());
    const selectionRange = e.getRange();
    //this.packageMessage(selectionRange, "selection");
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

        //uses session ID from props to either update backend 
      let data = {text: this.props.text};
      let sessionID = this.props.sessionID;

      if(sessionID !=='unsaved'){
            //if this session exists already, update the entry in dynamoDB
        const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateData/'+sessionID
        console.log(url)
        
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
          onCursorChange={this.handleChange}
          onSelectionChange = {this.handleChange}
          name="UNIQUE_ID_OF_DIV"
          value = {text}
          editorProps={{ $blockScrolling: true }}
        />
      </div>   
    );
  }
}

export default TextInput