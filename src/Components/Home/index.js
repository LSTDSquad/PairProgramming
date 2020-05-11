import React from "react";
import { Auth } from "aws-amplify";
import axios from "axios";

import { Container, Row, Toast, Col, Button, Card } from "react-bootstrap";
import { Switch, FormControlLabel } from "@material-ui/core";
import { AmplifySignOut } from "@aws-amplify/ui-react";
import { ArrowForwardRounded } from "@material-ui/icons";
import { ENDPOINT } from "../endpoints";
import "./Home.css";
import { Add } from "@material-ui/icons";
import code_window from "../../resources/code_window.png";
var async = require("async");


class Home extends React.Component {
  constructor(props) {
    super(props);
    // console.log(props);
    this.state = {
      user_name: String,
      user_id: String,
      prevSessions: [],
    };
  }

  componentDidMount() {
    //get the name of the user
    Auth.currentAuthenticatedUser()
      .then(user => {
        console.log("user", user);
        this.setState(
          {
            user_name: user.attributes.name,
            user_id: user.username,
            user: user
          },
          () => this.getUserSessions()
        );
      })
      .catch(err => console.log(err));
  }

  makeNewSession = () => {
    const url = ENDPOINT + "setData";
    const data = { text: "# happy coding!" };
    axios.post(url, data).then(
      response => {
        let newSession = "/" + response.data.id;
        this.props.history.push(newSession); //navigate to page referencing copy
      },
      error => {
        console.log(error);
      }
    );
  };

  getUserSessions = () => {
    console.log(this.state.user_name);
    const url = ENDPOINT + "getSessions/" + this.state.user_name;
    var self = this;
    axios.get(url).then(function(response) {
      console.log(response.data);
      async.map(response.data, function(sessionID, callback) {
        console.log(sessionID);
        const nameURL = ENDPOINT + "getName/" + sessionID;
        let sessionObj = {sessionID};

        //to load file name if it exists
        axios
          .get(nameURL)
          .then(function(response) {
            console.log(response.data);

            if (response.data.name === undefined) {
              // console.error("no file name associated")
              sessionObj.title = "Untitled"
            } else {
              sessionObj.title = response.data.name;
            }
            callback(null, sessionObj);
          })
          .catch(function(error) {
            // handle error
            console.log(error);
          });
        //const forksURL = ENDPOINT + 
        
      }, function(err, sessionObjs) {
        console.log(sessionObjs);
        //sessionObj is an array of objects, each with the fields sessionID and title
        self.setState({prevSessions: sessionObjs})
      });
    });
  };

  componentWillUnmount() {}

  render() {
    return (
      <Container className="justify-content-center vh-100">
        <Row
          noGutters={true}
          className="d-flex flex-row justify-content-between align-items-center bg-warning text-dark"
        >
          <h1 className="h1 m-2"> PearProgram </h1>
          <Button
            className="m-2 bg-dark"
            onClick={() => {
              this.state.user.signOut();
              window.location.reload(true);
            }}
          >
            Log out
          </Button>
        </Row>
        <Container className="w-70 h-100 ">
          <br />
          <br />
          <Row className="text-left">
            <h1 className="h1 m-2">{`Welcome, ${this.state.user_name}!`}</h1>
          </Row>
          <br />
          <Row className="w-70 d-flex flex-nowrap flex-row justify-content-between  align-items-start">
            <Col md="3">
              <Card onClick={this.makeNewSession}>
                <Card.Title className="h2 m-2">
                  {" "}
                  Ready to pair-program?
                </Card.Title>
                <Card.Text className="m-2">
                  Click here to create a new coding session!
                </Card.Text>
                {/* <div> */}
                {/* <span className="h4">Create a new coding session!</span> */}
                {/* <ArrowForwardRounded fontSize="large" /> */}
                <Card.Img variant="bottom" src={code_window} />
                {/* <Button>
                      <Add fontSize="large" />
                    </Button> */}
                {/* </div> */}
              </Card>
            </Col>
            <Col md="7">
              <Card>
                <Card.Title className="h4 m-2">
                  <div>Previous sessions</div>
                 
                </Card.Title>
                <Card.Body>
                  {this.state.prevSessions.map(({sessionID, title}) => (
                    <div key={sessionID} >{title}</div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row></Row>
          <Row></Row>
        </Container>
      </Container>
    );
  }
}

export default Home;
