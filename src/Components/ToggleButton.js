import React from 'react';
import { Button } from 'react-bootstrap';
import { SwapHoriz } from '@material-ui/icons';

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
					? <label> Role: Pilot <Button variant='warning' type="button" onClick = {this.handleClick}><SwapHoriz/></Button></label>
					: <label>Role: Copilot <Button variant='info' type="button" onClick = {this.requestToggle}><SwapHoriz/></Button></label>
      			}
      		</div>
    	);
	}
}


export default ToggleButton