import React from 'react';
import axios from 'axios';
import { useHistory } from "react-router-dom";
import {ENDPOINT} from './endpoints'

class CopyButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){

        //uses session ID from props to either update backend or create new table entry

    	let data = {text: this.props.text};
    	let sessionID = this.props.sessionID;
        console.log(this.props.history)

    	//if(sessionID==='unsaved'){
            //if this is a new session, write new session to dynamoDB
    		const url = ENDPOINT + 'setData'

	    	axios.post(url, data)
	    		.then(response => {
	    			const message = response.data;
	    			console.log(response.data.id);
                    let newSession = '/'+response.data.id;
                    this.props.onSessionIDChange(response.data.id);
                    this.props.history.push(newSession);
	    		},(error) => {
	    			console.log(error);
	    		});


    	//}
    	// else{
     //        //if this session exists already, update the entry in dynamoDB
    	// 	const url = 'https://4rvuv13ge5.execute-api.us-west-2.amazonaws.com/dev/updateData/'+sessionID
    	// 	console.log(url);
    	// 	axios.put(url,data)
    	// 		.then(response => {
    	// 			const message = response.data;
    	// 			console.log(message)},
    	// 		(error) => {
    	// 			console.log(error);
    	// 			}
    	// 		);
    	// }
    }

    render(){
    	return(
      	<button type="button" onClick = {this.handleClick}>Make Copy</button>
    );
  }
}

export default CopyButton