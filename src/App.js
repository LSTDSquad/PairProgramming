import React from 'react';
import logo from './logo.svg';
import './App.css';
import SplitPane from 'react-split-pane'

function App() {
  return (
   <SplitText/>
  );
}

class SplitText extends React.Component{
  //handles the state for both text boxes
  constructor(props){
    super(props);
    this.handleLeftChange = this.handleLeftChange.bind(this);
    this.handleRightChange = this.handleRightChange.bind(this);
    this.state={text: '', side: 'left'}
  }

  handleLeftChange(text){
    this.setState({side: 'left', text});
  }

  handleRightChange(text){
    this.setState({side: 'right', text});
  }

  render(){

    const side = this.state.side;
    const text = this.state.text;

    return (
      <SplitPane split="vertical" minSize={500} defaultSize={500}>
        <TextInput
          side = 'left'
          text = {text}
          onTextChange = {this.handleLeftChange} />
       <TextInput
          side = 'right'
          text = {text}
          onTextChange = {this.handleRightChange} />
      </SplitPane>
    )
  }
}

class TextInput extends React.Component{
  //individual text boxes that send state to split view
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    }

  handleChange(e) {
    this.props.onTextChange(e.target.value);
  }

  render(){
    const text = this.props.text;
    const side = this.props.side;
    return(
      <textarea value = {text} onChange = {this.handleChange}/>
    );
  }
}

export default App;
