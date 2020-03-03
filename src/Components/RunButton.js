import React from 'react';



class RunButton extends React.Component{
	constructor(props) {
   		 super(props);
    	 this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e){
    	console.log("Hello World");
    }

    render(){
    return(
      <button type="button" onClick = {this.handleClick}>Run</button>
    );
  }

}

export default RunButton