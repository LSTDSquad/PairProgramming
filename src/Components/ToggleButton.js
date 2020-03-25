import React from 'react';

class ToggleButton extends React.Component{

	constructor(props) {
	    super(props);

	    this.handleClick = this.handleClick.bind(this);
	    this.requestToggle = this.requestToggle.bind(this);
	  }

	 handleClick(){

	 	if(this.props.isPilot){
	 		this.props.onToggle();
	 	}
	 }

	 requestToggle(){
	 	this.props.onToggle();
	 }

 	render(){
    	return(
    		<div>
    			{this.props.isPilot 
					? <label> Role: Pilot <button type="button" onClick = {this.handleClick}>Toggle Role</button></label>
					: <label>Role: 'Copilot' <button type="button" onClick = {this.requestToggle}>Request Toggle</button></label>
      			}
      		</div>
    	);
	}
}


export default ToggleButton