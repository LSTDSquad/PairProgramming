import React from "react";
import "./CSS/TextOutput.css";

class TextOutput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.props.onTextChange(e.target.value);
  }

  render() {
    const text = this.props.text;
    const numbers = this.props.text;
    const listItems = numbers.map(numbers => <div style={numbers.indexOf('Error') >= 0 ? {color: 'red'} : {}}>{numbers}</div>);

    return <div className="output-text">{listItems}</div>;
  }
}

export default TextOutput;
