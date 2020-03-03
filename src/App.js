import React from 'react';
import logo from './logo.svg';
import './App.css';
import SplitPane from 'react-split-pane'
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import SplitText from './Components/SplitText';
import RunButton from './Components/RunButton';




function App() {
  return (
  	<div>
  		<RunButton/>
   		<SplitText/>
   		
   	</div>
  );
}


export default App;
