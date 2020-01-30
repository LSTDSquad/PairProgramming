import React from 'react';
import logo from './logo.svg';
import './App.css';
import SplitPane from 'react-split-pane'

function App() {
  return (
    <SplitPane split="vertical" minSize={50} defaultSize={100}>
  <div> hello</div>
  <div> world</div>
</SplitPane>
  );
}

export default App;
