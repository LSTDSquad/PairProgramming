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
import { withAuthenticator, Authenticator } from "aws-amplify-react"; // or 'aws-amplify-react-native';
import "@aws-amplify/ui/dist/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Loading from "./Components/Loading";
import About from "./About";

Amplify.configure(awsconfig);

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key.toLowerCase()] = value;
  });
  return vars;
}


function App() {
  const params = getUrlVars();
  const [attributes, setAttributes] = useState({ name: params['user'] || "Guest", email: null });
  const getAttributes = () => {
    Auth.currentAuthenticatedUser().then(user => {
      setAttributes(user.attributes);
    }).catch(() => { });
  };

  const calibrateOhYay = async () => {
    console.log("calibrating");
    const roomId = await window.ohyay.getCurrentRoomId();

    // pear_iframe is the tag you used for your iframe
    const iframe = (await window.ohyay.getRoomElements(roomId, 'pear_iframe'))[0];
    await window.ohyay.updateElement(iframe.id, { url: 'https://pearprogram.com/#/' + roomId + '?inohyay=true' })
    console.log('Current Room', roomId);
  }

  const setOhyayUser = async () => {
    const userId = await window.ohyay.getCurrentUserId();
    const user = await window.ohyay.getUser(userId);
    console.log('userId', userId);
    console.log('user', user);
    setAttributes({ name: user.name, email: userId });
  }

  const ensureOhyayAction = async action => {
    console.log(window.ohyay);
    if (window.ohyay.getCurrentRoomId) {
      await action();
    } else {
      await window.ohyay.setApiLoadedListener(async s => await action());
    }
  }

  // get user info upon initial load 
  useEffect(() => {
    getAttributes();

    if (params['newohyay'] === 'true') {
      console.log(window.ohyay);
      if (window.ohyay.getCurrentRoomId) {
        calibrateOhYay();
      } else {
        window.ohyay.registerMessageHandler(async () => {
          console.log("calibrating");
          const roomId = await window.ohyay.getCurrentRoomId();

          // pear_iframe is the tag you used for your iframe
          const iframe = (await window.ohyay.getRoomElements(roomId, 'pear_iframe'))[0];
          await window.ohyay.updateElement(iframe.id, { url: 'https://pearprogram.com/#/' + roomId + '?inohyay=true' })
          console.log('Current Room', roomId);
        });
      }
    }

    if (params['inohyay'] === 'true') {
      ensureOhyayAction(setOhyayUser);
    }

  }, []);

  return (
    <>
      <BoostrapOverrides />
      <Router>
        <div>
          <Switch>
            <Route
              exact
              path="/"
              render={routeProps => attributes.email ? <Home {...routeProps} /> :
                <Authenticator onStateChange={(authState) => getAttributes()} signUpConfig={signUpConfig} theme={myTheme} usernameAttributes='email' />} />
            <Route
              exact
              path="/about"
              render={routeProps => {
                return (<About {...routeProps} />)
              }}
            />
            <Route
              exact
              path="/:sessionID"
              render={routeProps => attributes ?
                <SplitText {...routeProps} attributes={attributes} /> :
                <SplitText {...routeProps} attributes={attributes} />
                // <Authenticator onStateChange={(authState) => getAttributes()}  signUpConfig={signUpConfig} theme={myTheme} usernameAttributes='email' />} />
              } />
          </Switch>
        </div>
      </Router>
    </>
  )
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

export default App;

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