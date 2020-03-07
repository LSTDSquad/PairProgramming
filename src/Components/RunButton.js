import React from 'react';
import axios from 'axios';

class RunButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){
    	console.log(this.props.text);

    	let data = {text: this.props.text};
    	let sessionID = this.props.sessionID;

    	//console.log(this.props.side)

    	if(sessionID=='unsaved'){

    		const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/setData'

	    	axios.post(url, data)
	    		.then(response => {
	    			const message = response.data;
	    			console.log(message);
	    		},(error) => {
	    			console.log(error);
	    		});
    	}
    	else{

    		console.log(sessionID);
    		const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateData/'+sessionID
    		
    		axios.put(url,data)
    			.then(response => {
    				const message = response.data;
    				console.log(message)},
    				(error) => {
    					console.log(error);
    				}
    			);
    	}
    }

    render(){
    	const text = this.props.text;
    	return(
      	<button type="button" text = {text} onClick = {this.handleClick}>Run</button>
    );
  }
}

export default RunButton