import React from 'react';
import logo from './logo.svg';
import './App.css';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import SplitText from './Components/SplitText';




function App() {
  return (
  	<div>
   		<SplitText/>
   		
   	</div>
  );
}


export default App;
