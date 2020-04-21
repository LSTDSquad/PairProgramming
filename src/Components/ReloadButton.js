import React from 'react';
import axios from 'axios';
import {ENDPOINT} from './endpoints';

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

	  	const url = ENDPOINT + 'getData/'+this.state.value
		var self = this	  	

	  	axios.get(url)
	  	.then(function(response){
	  		console.log(response.data)
	  		self.props.onTextChange(response.data);
	  	})

	    // alert('Session Text:  ' + loadedText);
	    event.preventDefault();
  }

  render() {
  	
  	const text = this.props.text;
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          SessionID:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Load Session" />
      </form>
    );
  }
}

export default ReloadButton