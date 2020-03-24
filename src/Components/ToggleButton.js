import React from 'react';

class ToggleButton extends React.Component{

	constructor(props) {
	    super(props);

	    this.handleClick = this.handleClick.bind(this);
	  }

	 handleClick(){
	 	this.props.onToggle();
	 }

 	render(){
    	return(
    		<label>
    			Role: {this.props.role ? 'Pilot' : 'CoPilot'}
      			<button type="button" onClick = {this.handleClick}>Toggle Role</button>
      		</label>
    	);
	}
}


export default ToggleButton