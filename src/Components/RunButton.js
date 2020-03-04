import React from 'react';
import axios from 'axios';

class RunButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){
    	console.log(this.props.text);
    	// axios.get('https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/ping')
    	// 	.then(response => {
    	// 		const message = response.data;
    	// 		console.log(message);
    	// 	},(error) => {
    	// 		console.log(error);
    	// 	});

    	let data = {text: this.props.text};

    	axios.post('https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/setData', data)
    		.then(response => {
    			const message = response.data;
    			console.log(message);
    		},(error) => {
    			console.log(error);
    		});
    }

    render(){
    	const text = this.props.text;
    	return(
      	<button type="button" text = {text} onClick = {this.handleClick}>Run</button>
    );
  }

  static _putText(url, text, callback){
	console.log('post', url);

	axios.post(url, {

	})
}
}

export default RunButton