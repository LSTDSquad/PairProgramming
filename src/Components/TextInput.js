import React from 'react';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";


class TextInput extends React.Component{
  //individual text boxes that send state to split view
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    }

  handleChange(e, event) {
    //console.log(event.action)
    const messageObj = {
      Who: this.props.userID,
      What: this.props.text,
      When: new Date().valueOf(),
    };

    this.props.sendMessage(messageObj);
    this.props.onTextChange(e);
  }

  render(){
    const text = this.props.text;
    const side = this.props.side;
    console.log("Received Message: ", this.props.history)
    return(
      <AceEditor
          mode="python"
          theme="github"
          onChange={this.handleChange}

          name="UNIQUE_ID_OF_DIV"
          value = {text}
          editorProps={{ $blockScrolling: true }}
        />
      
    );
  }
}

export default TextInput