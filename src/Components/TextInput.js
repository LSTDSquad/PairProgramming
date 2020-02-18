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

  handleChange(e) {
    this.props.onTextChange(e);
  }

  render(){
    const text = this.props.text;
    const side = this.props.side;
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