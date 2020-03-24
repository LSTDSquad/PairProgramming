import React from 'react';
import SaveButton from './SaveButton';
import LoadButton from './LoadButton';
import ToggleButton from './ToggleButton';

class ToolBar extends React.Component{

	constructor(props){
		super(props);

		this.handleChange = this.handleChange.bind(this);
	    this.handleSubmit = this.handleSubmit.bind(this);
	    this.handleToggle = this.handleToggle.bind(this);
	}

	handleChange(e){
		this.props.handleChange(e);
	}

	handleSubmit(e){
		this.props.handleSubmit(e);
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
	            	 onTextChange = {this.handleChange}
	           		 onSessionIDChange = {this.handleSubmit}/>
	           	<ToggleButton
	           		onToggle = {this.handleToggle}
	           		role = {this.props.role}/>

	         </div>
			)
	}
}

export default ToolBar