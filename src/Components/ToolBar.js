import React from "react";
// import SaveButton from "./SaveButton";
import LoadButton from "./LoadButton";
import ToggleButton from "./ToggleButton";
import RunButton from "./RunButton";
import { Navbar, Button, ListGroup } from "react-bootstrap";
import { Menu } from "@material-ui/icons";
import {Drawer } from '@material-ui/core'

import './CSS/ToolBar.css'

class ToolBar extends React.Component {
  constructor(props) {
	super(props);
	
	this.state = {
		drawerOpen: false,
	}

    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleIDChange = this.handleIDChange.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    //this.handleRun = this.handleRun.bind(this);
  }

  handleTextChange(e) {
    this.props.handleTextChange(e);
  }

  handleIDChange(e) {
    this.props.handleIDChange(e);
  }

  handleToggle() {
    this.props.handleToggle();
  }

//   handleRun() {
//     this.props.handleRun();
//   }

  toggleDrawer = (open) => {
	  this.setState({drawerOpen: open})
  }

  render() {
    return (
	  <Navbar variant="light" bg="info" className='top-bar'>
        <Button variant="light" onClick={() => this.toggleDrawer(true)}>
          <Menu />
        </Button>
		<Drawer anchor='left' open={this.state.drawerOpen} onClose={() => this.toggleDrawer(false)}>
			<ListGroup variant='flush'>
			<ListGroup.Item>Profile</ListGroup.Item>
				<ListGroup.Item>Pair Programming Tips</ListGroup.Item>
			</ListGroup>

		</Drawer>

        <ToggleButton
          onToggle={this.handleToggle}
          userNumber={this.props.userNumber}
          isPilot={this.props.isPilot}
        />
        {/* <SaveButton
          //component to save session to backend
          text={this.props.text}
          sessionID={this.props.sessionID}
        /> */}
        <LoadButton
          //component to reload session from session ID
          onTextChange={this.handleTextChange}
          onSessionIDChange={this.handleIDChange}
        />
        {/* <RunButton run={this.handleRun} /> */}
       </Navbar>
    );
  }
}

export default ToolBar;
