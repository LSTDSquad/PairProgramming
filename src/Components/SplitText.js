import React from 'react';
import SplitPane from 'react-split-pane'
import TextOutput from './TextOutput'
import TextInput from './TextInput'
import RunButton from './RunButton';
import SaveButton from './SaveButton';
import LoadButton from './LoadButton';
import PubNub from 'pubnub';
import { PubNubProvider, usePubNub} from 'pubnub-react';


class SplitText extends React.Component{
  //handles the state for both text boxes
  //state gets managed here (for now?)
  constructor(props){
    super(props);

    this.handleLeftChange = this.handleLeftChange.bind(this);
    this.handleRightChange = this.handleRightChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);

    this.state={
            text: 'The quick brown fox jumped over the lazy dog', 
            side: 'left', 
            sessionID: 'unsaved', //new session will default to 'unsaved' as the session ID
            userID: Math.round(Math.random() * 1000000).toString(),
            cursors: {}
          } 

    this.PubNub = new PubNub({
    subscribe_key: "sub-c-76b1e8e8-6988-11ea-94ed-e20534093ea4",
    publish_key: "pub-c-94dff15e-b743-4157-a74e-c7270627723b"})

    this.PubNub.addListener({
          status: event => {
            if (event.category === "PNConnectedCategory") {
            }
          },
          message: ({ channel, message}) => {
            console.log(`Message received in channel: ${channel}`, message.What);

            this.setState(({...this.state.cursors[message.Who]=message.What}));
          }
      });

    this.PubNub.subscribe({channels: ["channel1"], withPresence: true});
  }

  handleLeftChange(text){
    this.setState({side: 'left', text});
  }

  handleRightChange(text){
    this.setState({side: 'right', text});
  }

  handleSessionIDChange(sessionID){
    this.setState({sessionID: sessionID});
  }

  sendMessage(message){

    this.PubNub.publish( {channel:'channel1', 
                          message: message}, function(status, response) {
                              console.log('Publish Result: ', status, message)
    });
  }

  componentWillUnmount() {
    this.PubNub.unsubscribeAll();
  }

  render(){

    const side = this.state.side;
    const text = this.state.text;
    const sessionID = this.state.sessionID
    const userID = this.state.userID
    const cursors = this.state.cursors
    
    return (
      <div>
        <SaveButton 
          //component to save session to backend
          text = {text} 
          sessionID = {sessionID}/>
        <LoadButton 
          //component to reload session from session ID
            text = {text}
            sessionID = {sessionID}
            onTextChange = {this.handleLeftChange}
            onSessionIDChange = {this.handleSessionIDChange} />
        <SplitPane 
            //One side input, other side output, once we get app to run code?
            split="vertical" minSize={500} defaultSize={500}>
          <TextInput
            side = 'left'
            text = {text}
            onTextChange = {this.handleLeftChange} 
            onSendMessage = {this.sendMessage}
            userID = {userID}
            cursors = {cursors}/>
          <TextOutput
            side = 'right'
            text = {text}
            onTextChange = {this.handleRightChange}
            userID = {userID}/>        
        </SplitPane>
      </div>
    )
  }
}

export default SplitText