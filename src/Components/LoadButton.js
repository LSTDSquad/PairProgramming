import React from 'react';
import axios from 'axios';

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

	  	const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/getData/'+this.state.value
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
      <form onSubmit={this.handleSubmit}>
        <label>
          SessionID:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value= "Load Session"/>
      </form>
    );
  }
}

export default LoadButton