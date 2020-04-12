import React from 'react';
import logo from './logo.svg';
import './App.css';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import SplitText from './Components/SplitText';
import {
  HashRouter as Router,
  Route,
  Switch
} from 'react-router-dom'
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';
import { withAuthenticator } from 'aws-amplify-react'; // or 'aws-amplify-react-native';
import '@aws-amplify/ui/dist/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
Amplify.configure(awsconfig);



function App() {
  return (
  	
  		<Router>
  			<div>
  				<Switch>
  					<Route exact path="/" render={(routeProps) => <SplitText {...routeProps}/>} />
  					<Route exact path="/:sessionID" render={(routeProps) => <SplitText {...routeProps}  />} />
  				</Switch>

  		   	</div>
   		</Router>
  );
}


export default withAuthenticator(App, true);
