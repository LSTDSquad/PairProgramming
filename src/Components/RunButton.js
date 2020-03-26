import React from 'react';
import axios from 'axios';

class RunButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){
        this.props.run()
    	
    }

    render(){
    	const text = this.props.text;
    	return(
      	<button type="button" onClick = {this.handleClick}>Run</button>
    );
  }
}

export default RunButton