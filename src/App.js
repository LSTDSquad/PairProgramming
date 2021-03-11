import React, { useState, useEffect } from "react";
import "./App.css";
import AceEditor from "react-ace"; //needed
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import SplitText from "./Components/SplitText/";
import Home from "./Components/Home/";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Amplify from "aws-amplify";
import { I18n, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
import { withAuthenticator } from "aws-amplify-react"; // or 'aws-amplify-react-native';
import "@aws-amplify/ui/dist/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Loading from "./Components/Loading";
Amplify.configure(awsconfig);

function App() {
  const [attributes, setAttributes] = useState(null);
  useEffect(() => {
    Auth.currentAuthenticatedUser().then(user => {
      setAttributes(user.attributes);
    });
  }, []);

  return (
    attributes ? <>
      <BoostrapOverrides />
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
              render={routeProps => <SplitText {...routeProps} attributes={attributes} />}
            />
          </Switch>
        </div>
      </Router>
    </> : <Loading />
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

const myTheme = {
  signInButton: { 'backgroundColor': '#28a745' },
  container: { 'color': 'pink' },

}

const authLabels = {
  en: {
    'Sign Up': 'Create a new PearProgram Account',
    'My Customized Sign Up': 'Create a PearProgram Account',
    'Sign in to your account': 'Welcome to PearProgram!\nSign into your PearProgram Account',
  }
}

I18n.setLanguage('en');
I18n.putVocabularies(authLabels);

export default withAuthenticator(App, {
  signUpConfig,
  includeGreetings: false,
  usernameAttributes: "email",
  theme: myTheme,
});


const BoostrapOverrides = () => (
  <style type="text/css">
    {`
        .bg-primary {
          background-color: #005f39!important;
        }

        .btn-primary {
          color: #fff;
          background-color: #005f39;
          border-color: #005f39;
      }
      .btn-primary:focus, .btn-primary:hover, .btn-primary:active {
        color: #fff;
        background-color: #004429 !important;
        border-color: #004429 !important;
    }

    .btn-primary:disabled {
      color: #fff;
      background-color: #004429;
      border-color: #004429;
  }

      
      .btn-warning {
        color: #ffc107;
        background-color: #3e4346;
        border-color: #3e4346;
    }
      .btn-danger {
        color: #ff152b;
        background-color: #3e4346;
        border-color: #3e4346;
    }
      .btn-success {
        color: #00bb70;
        background-color: #3e4346;
        border-color: #3e4346;
    }
    .btn:focus {
      box-shadow: none !important;
    }
    `}
  </style>
);