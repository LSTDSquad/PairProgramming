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
import { withAuthenticator} from 'aws-amplify-react'; // or 'aws-amplify-react-native';
// import {AmplifySignOut} from '@aws-amplify/ui-react';
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

const signUpConfig = {
	header: 'My Customized Sign Up',
	hideAllDefaults: true,
	defaultCountryCode: '1',
	signUpFields: [
	  {
		label: 'My name',
		key: 'name',
		required: true,
		displayOrder: 1,
		type: 'string'
	  },
	  {
		label: 'Email',
		key: 'email',
		required: true,
		displayOrder: 2,
		type: 'string'
	  },
	  {
		label: 'Password',
		key: 'password',
		required: true,
		displayOrder: 3,
		type: 'password'
	  },
	]
  };
  const usernameAttributes = 'Email';
  
  export default withAuthenticator(App, {
	signUpConfig,
	includeGreetings: false,
	usernameAttributes: 'email',
	//theme: {myCustomTheme}
  });

// export default withAuthenticator(App, true);
