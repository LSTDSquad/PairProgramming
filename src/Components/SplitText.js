import React from 'react';
import SplitPane from 'react-split-pane'
import TextOutput from './TextOutput'
import TextInput from './TextInput'
import RunButton from './RunButton';
import SaveButton from './SaveButton';
import LoadButton from './LoadButton';

class SplitText extends React.Component{
  //handles the state for both text boxes
  //state gets managed here (for now?)
  constructor(props){
    super(props);
    this.handleLeftChange = this.handleLeftChange.bind(this);
    this.handleRightChange = this.handleRightChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.state={text: '', side: 'left', sessionID: 'unsaved'} //new session will default to 'unsaved' as the session ID
  }

  handleLeftChange(text){
    this.setState({side: 'left', text});
  }

  handleRightChange(text){
    this.setState({side: 'right', text});
  }

  handleSessionIDChange(sessionID){
    this.setState({sessionID: sessionID});
  }

  render(){

    const side = this.state.side;
    const text = this.state.text;
    const sessionID = this.state.sessionID

    return (
      <div>
        <SaveButton 
          //component to save session to backend
          text = {text} 
          sessionID = {sessionID}/>
        <LoadButton 
          //component to reload session from session ID
            text = {text}
            sessionID = {sessionID}
            onTextChange = {this.handleLeftChange}
            onSessionIDChange = {this.handleSessionIDChange} />
        <SplitPane 
            //One side input, other side output, once we get app to run code?
            split="vertical" minSize={500} defaultSize={500}>
          <TextInput
            side = 'left'
            text = {text}
            onTextChange = {this.handleLeftChange} />
          <TextInput 
            side = 'right'
            text = {text}
            onTextChange = {this.handleRightChange}/>        
        </SplitPane>
      </div>
    )
  }
}

export default SplitText