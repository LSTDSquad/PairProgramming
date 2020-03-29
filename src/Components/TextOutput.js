
import React from 'react';

class TextOutput extends React.Component{
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    //this.renderLine = this.renderLine.bind(this);
    }

    // renderLine(line, i) {
    //     return <OutputLine 
    //               output={line} 
    //               key={i} />
    // }

  handleChange(e) {
    this.props.onTextChange(e.target.value);
  }

  render(){
    const text = this.props.text;
    const numbers = this.props.text
    const listItems = numbers.map((numbers) =>
      <li>{numbers}</li>
    );
    return(
      <ul>{listItems}</ul>
    );
  }
}

export default TextOutput