import React from 'react';
import SaveButton from './SaveButton';
import LoadButton from './LoadButton';
import ToggleButton from './ToggleButton';

class ToolBar extends React.Component{

	constructor(props){
		super(props);

		this.handleTextChange = this.handleTextChange.bind(this);
	    this.handleIDChange = this.handleIDChange.bind(this);
	    this.handleToggle = this.handleToggle.bind(this);
	}

	handleTextChange(e){
		this.props.handleTextChange(e);
	}

	handleIDChange(e){
		this.props.handleIDChange(e);
	}

	handleToggle(){
		this.props.handleToggle();
	}

	render(){
		return(
			<div>
				<SaveButton 
	          		//component to save session to backend
	          		text = {this.props.text} 
	         		sessionID = {this.props.sessionID}/>
	       		 <LoadButton 
	         		 //component to reload session from session ID
	            	 onTextChange = {this.handleTextChange}
	           		 onSessionIDChange = {this.handleIDChange}/>
	           	<ToggleButton
	           		onToggle = {this.handleToggle}
	           		userNumber = {this.props.userNumber}
	           		isPilot = {this.props.isPilot}/>

	         </div>
			)
	}
}

export default ToolBar