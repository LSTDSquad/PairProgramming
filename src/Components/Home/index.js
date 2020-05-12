import React from "react";
import { Auth } from "aws-amplify";
import axios from "axios";

import {
  Container,
  Row,
  Toast,
  Col,
  Button,
  Card,
  Badge,
  Accordion
} from "react-bootstrap";
import { Switch, FormControlLabel } from "@material-ui/core";
import { AmplifySignOut } from "@aws-amplify/ui-react";
import { ArrowForwardRounded, ExitToAppRounded } from "@material-ui/icons";
import { ENDPOINT } from "../endpoints";
import "./Home.css";
import { Add } from "@material-ui/icons";
import code_window from "../../resources/code_window.png";
import Loading from "../Loading/";
import { Link } from "react-router-dom";
var async = require("async");

class Home extends React.Component {
  constructor(props) {
    super(props);
    // console.log(props);
    this.state = {
      user_name: String,
      user_id: String,
      prevSessions: [],
      doneLoading: false,
      allForks: []
    };
  }

  componentDidMount() {
    //get the name of the user
    Auth.currentAuthenticatedUser()
      .then(user => {
        //console.log("user", user);
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
    const url = ENDPOINT + "getSessions/" + this.state.user.attributes.email;
    var self = this;
    axios
      .get(url)
      .then(function(response) {
        async.map(
          response.data,
          function(sessionID, callback) {
            const nameURL = ENDPOINT + "getName/" + sessionID;
            let sessionObj = { sessionID };

            //to load file name if it exists
            axios
              .get(nameURL)
              .then(function(response) {
                if (response.data === "") {
                  // console.error("no file name associated")
                  sessionObj.title = "Untitled";
                } else {
                  sessionObj.title = response.data;
                }

                // callback(null, sessionObj);
                const forksURL = ENDPOINT + "getChildren/" + sessionID;

                return axios.get(forksURL);
              })
              .then(function(response) {
                sessionObj.forks = response.data || [];

                const timestampURL = ENDPOINT + "getLastEdit/" + sessionID;

                return axios.get(timestampURL);
              })
              .then(function(response) {
                console.log("last edit", response.data);
                sessionObj.lastEditTimeStamp = response.data;
                async.map(
                  sessionObj.forks,
                  function(fork, callbackChild) {
                    self.setState(prevState => ({
                      allForks: [...prevState.allForks, fork]
                    }));
                    const nameurl = ENDPOINT + "getName/" + fork;
                    let childObj = { sessionID: fork };

                    //to load file name if it exists
                    axios.get(nameurl).then(function(response) {
                      if (response.data === "") {
                        // console.error("no file name associated")
                        childObj.title = "Untitled";
                      } else {
                        childObj.title = response.data;
                      }
                      callbackChild(null, childObj);
                    });
                  },
                  function(err, newForks) {
                    sessionObj.forks = newForks;
                    callback(err, sessionObj);
                  }
                );
              })

              // .then(function(response) {
              //   console.log("last edit", response.data);
              //   sessionObj.lastEditTimeStamp = response.data;
              //   callback(null, sessionObj);
              // })

              .catch(function(error) {
                // handle error
                console.log(error);
                callback(error, sessionObj);
              });

            // const timestampURL = ENDPOINT + "getLastEdit/" + sessionID;

            // axios
            //   .get(timestampURL)
            //   .then(function(response) {
            //     console.log("last edit", response.data);
            //     sessionObj.lastEditTimeStamp = response.data;
            //   })
            //   .catch(function(error) {
            //     console.log(error);
            //   });
          },
          function(err, sessionObjs) {
            console.log(sessionObjs);

            //sessionObj is an array of objects, each with the fields sessionID and title
            self.setState({ prevSessions: sessionObjs, doneLoading: true });
          }
        );
      })
      //in case they don't have an account in the userTable yet.
      .catch(err => self.setState({ doneLoading: true }));
  };

  componentWillUnmount() {}

  render() {
    return this.state.doneLoading ? (
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
              <Card bg="success" text="white">
                <Card.Title className="h2 m-2">
                  {" "}
                  Ready to pair-program?
                </Card.Title>
                <Card.Text className="m-2">
                  <Button variant="light" onClick={this.makeNewSession}>
                    Click here to create a new coding session!
                  </Button>
                </Card.Text>
                {/* <div> */}
                {/* <span className="h4">Create a new coding session!</span> */}
                {/* <ArrowForwardRounded fontSize="large" /> */}
                {/* <Card.Img variant="bottom" src={code_window} /> */}
                {/* <Button>
                      <Add fontSize="large" />
                    </Button> */}
                {/* </div> */}
              </Card>

              <br />
              <Card bg="secondary" text="white">
                <Card.Title className="h2 m-2">
                  {" "}
                  Want to learn how to pair-program with PearProgram?
                </Card.Title>
                <Card.Text className="m-2">
                  <a href="https://docs.google.com/document/d/1no_wxlU8qIZmAHOmlS1v3skXLd-_0O0hr1z6h-WoUwA/edit?usp=sharing">
                    <Button variant="light">Read the guide</Button>
                  </a>
                </Card.Text>
                {/* <div> */}
                {/* <span className="h4">Create a new coding session!</span> */}
                {/* <ArrowForwardRounded fontSize="large" /> */}
                {/* <Card.Img variant="bottom" src={code_window} /> */}
                {/* <Button>
                      <Add fontSize="large" />
                    </Button> */}
                {/* </div> */}
              </Card>
            </Col>
            <Col md="9">
              <Card bg="primary" text="white">
                <Card.Title className="h4 m-2">
                  <div>Previous sessions</div>
                </Card.Title>
                <Card.Body className="text-dark">
                  <Accordion>
                    {this.state.prevSessions
                      .filter(
                        ({ sessionID }) =>
                          this.state.allForks.indexOf(sessionID) === -1
                      )
                      .map(
                        (
                          { sessionID, title, forks, lastEditTimeStamp },
                          parent_i
                        ) => (
                          <Card variant="outline-primary" key={sessionID}>
                            <Card.Header className="d-flex w-100 flex-row justify-content-between">
                              {title}
                              <div>
                                

                                {forks.length > 0 && (
                                  <Accordion.Toggle
                                    as={Button}
                                    variant="link"
                                    eventKey={`${parent_i}`}
                                  >
                                    See forks
                                  </Accordion.Toggle>
                                )}
                                <Badge variant="secondary" fontSize="md">
                                  Last edit: {getTimeDiff(lastEditTimeStamp)}
                                </Badge>
                                {` `}
                                <Link to={`/${sessionID}`}>
                                  <ExitToAppRounded />
                                </Link>
                              </div>
                            </Card.Header>
                            {forks.map((fork, i) => (
                              <Accordion.Collapse
                                eventKey={`${parent_i}`}
                                key={i}
                              >
                                <Card.Body className="d-flex w-100 flex-row justify-content-between">
                                  <div>{fork.title}</div>
                                  <Link to={`/${fork.sessionID}`}>
                                    <ExitToAppRounded />
                                  </Link>
                                </Card.Body>
                              </Accordion.Collapse>
                            ))}
                          </Card>
                        )
                      )}
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row></Row>
          <Row></Row>
        </Container>
      </Container>
    ) : (
      <Loading />
    );
  }
}

export default Home;

const MS_PER_HOUR = 1000 * 60 * 60;
const HOURS_PER_DAY = 24;

//expect time1 to be a string
//returns string like "8 hours ago" or "1 day ago"
const getTimeDiff = (time1) => {
  const now = Date.now();
  if (time1 === "") return "unknown";
  const timeMS = Date.parse(time1);
  // const timeMS = date.getValue();
  try {
    const diff = now - timeMS;
    const hoursSince = Math.floor(diff / MS_PER_HOUR);
    if (hoursSince == 0) return "less than an hour ago";
    if (hoursSince < HOURS_PER_DAY) {
      return `${hoursSince} hour${hoursSince == 1 ? "" : "s"} ago`;
    }
    //it's more than 23 hours
    const daysSince = Math.floor(hoursSince / HOURS_PER_DAY);
    return `${daysSince} day${daysSince == 1 ? "" : "s"} ago`;
  } catch (e) {
    console.log(e);
    return "unknown";
  }
};
