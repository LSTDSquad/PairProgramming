import React from 'react';
import SplitPane from 'react-split-pane'
import TextOutput from './TextOutput'
import TextInput from './TextInput'
import RunButton from './RunButton';
import ReloadButton from './ReloadButton';

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
      <div>
        <RunButton text = {text} />
        <ReloadButton 
            text = {text}
            onTextChange = {this.handleLeftChange} />
        <SplitPane split="vertical" minSize={500} defaultSize={500}>
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