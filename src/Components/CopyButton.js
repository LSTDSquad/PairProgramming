import React from 'react';
import axios from 'axios';
import {Button} from 'react-bootstrap'
import { useHistory } from "react-router-dom";

class CopyButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){

        //Generates copy of current page and saves it to dynamoDB

    	let data = {text: this.props.text};
    	let sessionID = this.props.sessionID;
        console.log(this.props.history)

    	//if(sessionID==='unsaved'){
            //if this is a new session, write new session to dynamoDB
    		const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/setData'

	    	axios.post(url, data)
	    		.then(response => {
	    			const message = response.data;
	    			console.log(response.data.id);
                    let newSession = '/'+response.data.id;
                    this.props.onSessionIDChange(response.data.id);
                    this.props.history.push(newSession); //navigate to page referencing copy
	    		},(error) => {
	    			console.log(error);
	    		});
    }

    render(){
    	return(
      	<Button type="button" variant='light' onClick = {this.handleClick}>Make Copy</Button>
    );
  }
}

export default CopyButton