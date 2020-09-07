import React from "react";
import "./TextOutput.css";

class TextOutput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputVal: ""
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    console.log(this.props.waitingForInput);
    if (!this.props.waitingForInput && this.state.inputVal) {
      this.setState({ inputVal: "" });
    }
  }

  showOutput = () => this.props.text;

  handleChange(e) {
    this.props.onTextChange(e.target.value);
  }

  handleInputChange = e => {
    this.setState({ inputVal: e.target.value });
  };

  handleInputSubmit = e => {
    e.preventDefault();
    console.log(e);
  };
  render() {
    const text = this.props.text;
    const listItems = text.map((text, i) => (
      <div
        key={i}
        //it's white for regular, green for input, red for error
        style={{
          color:
            text.indexOf("Error: ") >= 0
              ? "red"
              : text.indexOf(">") == 0
              ? "#28a745"
              : "white"
            , 
          wordWrap: "break-word"
        }}
      >
        {text}
      </div>
    ));

    return (
      <div className="output-text">
        {listItems}
        {/* <span>> </span><span contentEditable="true" ></span> */}
        {/* <div contentEditable="true" 
    className="std-input"
    onKeyDown={this.keyPress}
    ></div> */}
        {/* hidden={this.props.waitingForInput ? "false" : "true"} */}
        <textarea
          style={{ display: this.props.waitingForInput ? "inherit" : "none" }}
          id="std-input"
          className="std-input"
          value={this.state.inputVal}
          onChange={this.handleInputChange}
        />

        {/* <form onSubmit={this.handleInputSubmit}>
        <label>
          <input type="text" value={this.state.inputVal} onChange={this.handleInputChange} />
        </label>
        <input type="submit" value=""/>

      </form> */}
      </div>
    );
    // return (
    //   <Terminal
    //       color='white'
    //       backgroundColor='#292a2e'
    //       barColor='black'
    //       hideTopBar={true}
    //       style={{ fontWeight: "bold", fontSize: "1em" }}
    //       commandPassThrough={cmd => `-PassedThrough:${cmd}: command not found`}
    //       commands={{
    //         'run': (args, print, runCommand) => print(this.props.text),
    //         // show: this.showOutput,
    //         // popup: () => alert('Terminal in React')
    //       }}
    //       descriptions={{
    //         // 'open-google': 'opens google.com',
    //         run: 'run your program!',
    //         // alert: 'alert', popup: 'alert'
    //       }}
    //       msg='Welcome to PearProgram! Your output will show up here when you press the run button or type "run"'
    //     />
    // )
  }
}

export default TextOutput;
