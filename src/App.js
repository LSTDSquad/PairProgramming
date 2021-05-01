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

const URL_PREFIX = 'https://fix-for-ohyay.d1tkneodyg1kgq.amplifyapp.com/#/';
const TEMPLATE_ROOMS = new Set(['scene_JkvFBW0n', 'scene_-E27Igal']);

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key.toLowerCase()] = value;
  });
  return vars;
}


function App() {
  const params = getUrlVars();
  let [displayName, setDisplayName] = useState(params['user'] || 'Guest');

  //used for the userTable
  let [userSignature, setUserSignature] = useState(null); //normally the email, but sometimes the ohyay userID


  const getAttributes = () => {
    Auth.currentAuthenticatedUser().then(user => {
      const {name, email} = user.attributes;
      setDisplayName(name);
      setUserSignature(email);
    }).catch(() => {});
  };

  const calibrateOhYay = async () => {
    const roomId = await window.ohyay.getCurrentRoomId();
    if (TEMPLATE_ROOMS.has(roomId)) { //whatever the template id is 
      return;
    }
    // pear_iframe is the tag you used for your iframe
    const iframe = (await window.ohyay.getRoomElements(roomId, 'pear_iframe'))[0];
    await window.ohyay.updateElement(iframe.id, { url: URL_PREFIX + roomId + '?inohyay=true' })
  }

  const setOhyayUser = async () => {
<<<<<<< HEAD
    console.log("setting ohyay user");
    const userId = await window.ohyay.getCurrentUserId();
    const user = await window.ohyay.getUser(userId);
    console.log(user);
=======
    console.log("set ohyay user");
    const userId = await window.ohyay.getCurrentUserId();
    const user = await window.ohyay.getUser(userId);
>>>>>>> 6d25fe13d8a6243a9051fce159e36630b8481bc1
    if (user) { // if user is not anonymous 
      setDisplayName(user.name);
      setUserSignature(userId); //something like u_jwwiu1ijefj08 . 
    }
    console.log('userID', userId);
  }

  const ensureOhyayAction = async action => {
    if (!window.ohyay) {
      // resource didn't load 
      console.log("window.ohyay doesn't exist");
      return;
    }
    if (window.ohyay.getCurrentRoomId) {
      console.log("ohyay already loaded");
      await action();
    } else {
<<<<<<< HEAD
      console.log("waiting to load");
=======
>>>>>>> 6d25fe13d8a6243a9051fce159e36630b8481bc1
      await window.ohyay.setApiLoadedListener(async s => await action()); //it doesn't wait forever! 
    }
  }

  // get user info upon initial load 
  useEffect(() => {
    if (params['inohyay'] === 'true') {
      //don't care about the authentication or logged in state if it's in ohyay
      ensureOhyayAction(setOhyayUser);
    } else if (params['newohyay'] === 'true') {
      ensureOhyayAction(calibrateOhYay);
    } else { // just a regular browser 
      getAttributes();
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
              render={routeProps => userSignature ? <Home {...routeProps} /> : 
              <Authenticator onStateChange={(authState) => getAttributes()}  signUpConfig={ signUpConfig } theme={myTheme} usernameAttributes='email' />} />
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
              render={routeProps => <SplitText {...routeProps} name={displayName} userSignature={userSignature} /> }/>
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