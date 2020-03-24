import React from 'react';
import SplitPane from 'react-split-pane'
import TextOutput from './TextOutput'
import TextInput from './TextInput'
import ToolBar from './ToolBar';
import PubNub from 'pubnub';
import {PubNubProvider, usePubNub} from 'pubnub-react';


class SplitText extends React.Component{
  //handles the state for both text boxes
  //state gets managed here (for now?)
  constructor(props){
    super(props);

    this.handleLeftChange = this.handleLeftChange.bind(this);
    this.handleRightChange = this.handleRightChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.toggleRole = this.toggleRole.bind(this);

    this.state={
            text: 'The quick brown fox jumped over the lazy dog', 
            side: 'left', 
            sessionID: 'unsaved', //new session will default to 'unsaved' as the session ID
            userID: Math.round(Math.random() * 1000000).toString(),

            //these two items operate like dictionaries key: userID, value: cursor/highligh coordinates
            cursors: {},
            selections: {},
            isPilot: true
          } 

    this.PubNub = new PubNub({
            subscribe_key: "sub-c-76b1e8e8-6988-11ea-94ed-e20534093ea4",
            publish_key: "pub-c-94dff15e-b743-4157-a74e-c7270627723b",
            uuid: this.state.userID,
            presenceTimeout: 120
          });

    //add PubNub listener to handle messages
    this.PubNub.addListener({
          message: ({ channel, message}) => {
            console.log(`Message received in channel: ${channel}`, message.What);

            if(message.Type == 'cursor'){
              //if message containing cursor change info comes in, update cursor object in setState
              this.setState(({...this.state.cursors[message.Who]=message.What}));
            }

            else{
                //if message containing highlight change info comes in, update selection object in state
                this.setState(({...this.state.selections[message.Who]=message.What}));
            }
          },
          presence: function(presenceEvent){
            console.log(presenceEvent);}
      });

    //subscribe to channel based on sessionID
    this.PubNub.subscribe({channels: [this.state.sessionID], withPresence: true});
  }

  componentDidMount(){
    this.PubNub.hereNow(
      {
          //channels: [this.state.sessionID], 
          //channelGroups : ["cg1"],
          includeUUIDs: true,
          includeState: true 
      },
      function (status, response) {
          console.log(status,response);
      }
    );
  }


  //                                             ///
  //Functions that handle various changes/updates///
  //                                             ///

  handleLeftChange(text){
      this.setState({side: 'left', text});
  }

  handleRightChange(text){
    this.setState({side: 'right', text});
  }

  handleSessionIDChange(id){
    //on sessionID change (session was loaded), unsubscribe
    this.PubNub.unsubscribe({ channels: [this.state.sessionID]});

    //clear cursors/highlights from state
    this.setState({cursors: {}, selections:{}});

    //set the sessionID in state and subscribe to new channel based on sessionID
    this.setState({sessionID: id}, () =>{
       //use callback due to asynchronous nature of .setState
       this.PubNub.subscribe({channels: [this.state.sessionID], withPresence: true});
    }) 
  }

  toggleRole(){
    this.setState({isPilot: !this.state.isPilot});
  }

  sendMessage(message,type){

    //send cursor/selection message on sessionID channel
    this.PubNub.publish( {channel: this.state.sessionID, 
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
    const selections = this.state.selections
    const role = this.state.isPilot
    
    return (
      <div>
        <ToolBar
            text = {text}
            sessionID = {sessionID}
            role = {role}
            handleChange = {this.handleLeftChange}
            handleSubmit = {this.handleSessionIDChange}
            handleToggle = {this.toggleRole}/>
        <SplitPane 
            //One side input, other side output, once we get app to run code?
            split="vertical" minSize={500} defaultSize={500}>
          <TextInput
            side = 'left'
            text = {text}
            role = {role}
            onTextChange = {this.handleLeftChange} 
            onSendMessage = {this.sendMessage}
            userID = {userID}
            cursors = {cursors}
            selections = {selections}/>
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