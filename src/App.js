import React from 'react';
import logo from './logo.svg';
import './App.css';
import SplitPane from 'react-split-pane'
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
//import SplitText from './Components/SplitText';
import TextInput from './Components/TextInput';
import TextOutput from './Components/TextOutput';



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
          onTextChange = {this.handleRightChange}/>        
      </SplitPane>
    )
  }
}

// class TextInput extends React.Component{
//   //individual text boxes that send state to split view
//   constructor(props) {
//     super(props);
//     this.handleChange = this.handleChange.bind(this);
//     }

//   handleChange(e) {
//     this.props.onTextChange(e);
//   }

//   render(){
//     const text = this.props.text;
//     const side = this.props.side;
//     return(
//       <AceEditor
//           mode="python"
//           theme="github"
//           onChange={this.handleChange}
//           name="UNIQUE_ID_OF_DIV"
//           value = {text}
//           editorProps={{ $blockScrolling: true }}
//         />
      
//     );
//   }
// }

// class TextOutput extends React.Component{
//   constructor(props) {
//     super(props);
//     this.handleChange = this.handleChange.bind(this);
//     }

//   handleChange(e) {
//     this.props.onTextChange(e.target.value);
//   }

//   render(){
//     const text = this.props.text;
//     return(
//       <div>Writing: {text} </div>
//     );
//   }
// }

export default App;
