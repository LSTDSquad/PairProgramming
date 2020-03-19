import React from 'react';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";


class TextInput extends React.Component{
  //individual text boxes that send state to split view
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleCursorChange = this.handleCursorChange.bind(this);
    }

  handleChange(e, event) {
    //console.log(event.action)
    this.props.onTextChange(e);
  }

  handleCursorChange(e){
      const cursorPosition = e.getCursor();
      const messageObj = {
          Who: this.props.userID,
          What: cursorPosition,
          When: new Date().valueOf()
        };

    console.log(messageObj)

    this.props.onSendMessage(messageObj);
  }

  render(){
    const text = this.props.text;
    const side = this.props.side;
    return(
      <AceEditor
          mode="python"
          theme="github"
          onChange={this.handleChange}
          onCursorChange={this.handleCursorChange}
          name="UNIQUE_ID_OF_DIV"
          value = {text}
          editorProps={{ $blockScrolling: true }}
        />
      
    );
  }
}

export default TextInput