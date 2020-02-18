
import React from 'react';

class TextOutput extends React.Component{
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    }

  handleChange(e) {
    this.props.onTextChange(e.target.value);
  }

  render(){
    const text = this.props.text;
    return(
      <div>Writing: {text} </div>
    );
  }
}

export default TextOutput