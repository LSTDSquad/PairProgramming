import React from 'react';
import axios from 'axios';
import {Button, Form } from 'react-bootstrap'
import {ENDPOINT} from './endpoints'

class LoadButton extends React.Component{
	
	constructor(props) {
	    super(props);
	    this.state = {value: ''};

	    this.handleChange = this.handleChange.bind(this);
	    this.handleSubmit = this.handleSubmit.bind(this);
	  }

	handleChange(event) {
    	this.setState({value: event.target.value});
  	 }

  	handleSubmit(event) {

  		//uses session ID from props to use backend 'getData' function to reload session

	  	const url = ENDPOINT + 'getData/'+this.state.value
		  var self = this	  	

	  	axios.get(url)
	  	.then(function(response){
	  		self.props.onTextChange(response.data);
	  	})

	    event.preventDefault();

	    this.props.onSessionIDChange(this.state.value); //set session ID for app by calling SplitText.js handleSessionIDChange
  }

  render() {
  	
    return (
	<Form onSubmit={this.handleSubmit}>
        <Form.Label>
          SessionID:{' '}
          <Form.Control type="text" value={this.state.value} onChange={this.handleChange} />
        </Form.Label>
        <Button variant='primary' type="submit">Load</Button>
      </Form>
    );
  }
}

export default LoadButton