import React from 'react';
import axios from 'axios';



class RunButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){
    	console.log("Hello World");
    	axios.get('https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/ping')
    		.then(response => {
    			const message = response.data;
    			console.log(message);
    		},(error) => {
    			console.log(error);
    		});
    }

    render(){
    return(
      <button type="button" onClick = {this.handleClick}>Run</button>
    );
  }

}

export default RunButton