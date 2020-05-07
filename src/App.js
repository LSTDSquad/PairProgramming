import React from "react";
import "./App.css";
import AceEditor from "react-ace"; //needed
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import SplitText from "./Components/SplitText";
import Home from "./Components/Home";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Amplify from "aws-amplify";
import awsconfig from "./aws-exports";
import { withAuthenticator } from "aws-amplify-react"; // or 'aws-amplify-react-native';
import "@aws-amplify/ui/dist/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
Amplify.configure(awsconfig);

function App() {
  return (
    <Router>
      <div>
        <Switch>
          <Route
            exact
            path="/"
            render={routeProps => <Home {...routeProps} />}
          />
          <Route
            exact
            path="/:sessionID"
            render={routeProps => <SplitText {...routeProps} />}
          />
        </Switch>
      </div>
    </Router>
  );
}

const signUpConfig = {
  header: "My Customized Sign Up",
  hideAllDefaults: true,
  defaultCountryCode: "1",
  signUpFields: [
    {
      label: "My name",
      key: "name",
      required: true,
      displayOrder: 1,
      type: "string"
    },
    {
      label: "Email",
      key: "email",
      required: true,
      displayOrder: 2,
      type: "string"
    },
    {
      label: "Password",
      key: "password",
      required: true,
      displayOrder: 3,
      type: "password"
    }
  ]
};

export default withAuthenticator(App, {
  signUpConfig,
  includeGreetings: false,
  usernameAttributes: "email"
  //theme: {myCustomTheme}
});
