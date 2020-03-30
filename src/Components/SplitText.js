import React from 'react';
import SplitPane from 'react-split-pane'
import TextOutput from './TextOutput'
import TextInput from './TextInput'
import ToolBar from './ToolBar';
import PubNub from 'pubnub';
import {PubNubProvider, usePubNub} from 'pubnub-react';
import axios from 'axios';
import Sk from 'skulpt';
import 'skulpt/dist/skulpt.min.js'
import 'skulpt/dist/skulpt-stdlib.js'


class SplitText extends React.Component{
  //handles the state for both text boxes
  //state gets managed here (for now?)
  constructor(props){
    super(props);

    this.handleLeftChange = this.handleLeftChange.bind(this);
    this.handleRightChange = this.handleRightChange.bind(this);
    this.handleSessionIDChange = this.handleSessionIDChange.bind(this);
    this.handleCursorChange = this.handleCursorChange.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.toggleRole = this.toggleRole.bind(this);
    this.assignUserNumber = this.assignUserNumber.bind(this);
    this.assignRole = this.assignRole.bind(this);
    this.outputRef = React.createRef();
    this.outf = this.outf.bind(this);
    this.builtinRead = this.builtinRead.bind(this);
    this.runCode = this.runCode.bind(this);

    this.state={
            text: 'print(3+5)', 
            side: 'left', 
            sessionID: 'unsaved', //new session will default to 'unsaved' as the session ID
            userID: Math.round(Math.random() * 1000000).toString(),

            //these two items operate like dictionaries key: userID, value: cursor/highlight coordinates
            cursors: {},
            selections: {},
            isPilot: true,
            lines:['Output:'],
            userNumber: 1 //number based on order of subscription to channel
          } 


    //////                                       //////
   //////      Initial Pubnub setup             //////
  //////                                       //////

    this.PubNub = new PubNub({
            subscribe_key: "sub-c-76b1e8e8-6988-11ea-94ed-e20534093ea4",
            publish_key: "pub-c-94dff15e-b743-4157-a74e-c7270627723b",
            uuid: this.state.userID,
            presenceTimeout: 120
          });

    //add PubNub listener to handle messages
    this.PubNub.addListener({
          message: ({ channel, message}) => {
            console.log(`Message received in channel: ${channel}`, message.What, message.Who);

            if(message.Type === 'cursor' & message.Who != this.state.userID){
              //if message containing cursor change info comes in, update cursor object in setState

              this.setState(({...this.state.cursors[message.Who]=message.What}));

            }

             if(message.Type === 'text' & message.Who != this.state.userID){
              this.setState(({text: message.What}));
            }

            else if (message.Type === 'selection' & message.Who != this.state.userID){
                //if message containing highlight change info comes in, update selection object in state
                this.setState(({...this.state.selections[message.Who]=message.What}));
            }
          }
      });

    //subscribe to channel based on sessionID
    this.PubNub.subscribe({channels: [this.state.sessionID], withPresence: true});

    let currentComponent = this;
    //to reference state in callback function

    this.PubNub.hereNow(
      {
          channels: [this.state.sessionID], 
          includeUUIDs: true,
          includeState: true 
      },
      function (status, response) {
          //set this window's userNumber to the current number of users on the channel
          currentComponent.setState({userNumber: response.totalOccupancy});
          currentComponent.assignRole();
      }
    );
  }

  sendMessage(message,type){

    //send cursor/selection message on sessionID channel
    this.PubNub.publish( {channel: this.state.sessionID, 
                          message: message}, function(status, response) {
                              console.log('Publish Result: ', status, message)
    });
  }

    //////                                       //////
   //////     Skulpt functions to run python    //////
  //////                                       //////

   outf(text) { 
     var arr = []
     console.log(text);
     arr.push(text);
     console.log(arr);
     //this.setState({lines:["Output"]});
     this.setState(prevState => ({
          lines: [...prevState.lines, text]
        }))
    } 
 
 builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
  }

  runCode(){

    var input = this.state.text
    
    Sk.configure({output:this.outf, read:this.builtinRead}); 

    try {
      Sk.importMainWithBody("<stdin>", false, input, true);
    }

    catch(e) {
      this.setState(prevState => ({
          lines: [...prevState.lines, e.toString()]
        }))
    }

  }

    //////                                                    //////
   //////   Functions that handle state changes/updates      //////
  //////                                                    //////

  componentDidMount(){
  }
  componentDidUpdate(){
  }

  handleLeftChange(text){
      this.setState({lines:["Output"]});
      this.setState({side: 'left', text});
  }

  handleRightChange(text){
    this.setState({side: 'right', text});
  }

  handleCursorChange(user,cursor){

  }

  handleSelectionChange(){

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
       this.assignUserNumber();
       this.assignRole();
    }) 
  }

  toggleRole(){
    console.log(this.state.userNumber);
    this.setState({isPilot: !this.state.isPilot});
  }

  assignRole(){
    //assign role based on userNumber
    //only person with number 1 will start as pilot
    console.log('userNumber', this.state.userNumber);
    if(this.state.userNumber <= 1){
      this.setState({isPilot: true});
    }
    else{
      this.setState({isPilot: false});
    }
  }

  assignUserNumber(){
    //assign the window a number based on when they showed up in channel
    //i.e the 7th user to subscribe will get number 7
    let currentComponent = this;

    this.PubNub.hereNow(
    //set this window's userNumber to the current number of users on the channel
      {
          channels: [this.state.sessionID], 
          includeUUIDs: true,
          includeState: true 
      },
      function (status, response) {
          currentComponent.setState({userNumber: response.totalOccupancy});
          //currentComponent.assignRole();
      }
    );
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
    const isPilot = this.state.isPilot
    const userNumber = this.state.userNumber
    const codeOutput = this.state.lines;

    return (
      <div>
        <ToolBar
            text = {text}
            sessionID = {sessionID}
            isPilot = {isPilot}
            userNumber = {userNumber}
            handleTextChange = {this.handleLeftChange}
            handleIDChange = {this.handleSessionIDChange}
            handleToggle = {this.toggleRole}
            handleRun = {this.runCode}/>
        <SplitPane 
            //One side input, other side output, once we get app to run code?
            split="vertical" minSize={500} defaultSize={500}>
          <TextInput
            side = 'left'
            text = {text}
            ref = 'input'
            isPilot = {isPilot}
            onTextChange = {this.handleLeftChange} 
            onCursorChange = {this.handleCursorChange}
            onSelectionChange = {this.handleSelectionChange}
            sessionID = {sessionID}
            onSendMessage = {this.sendMessage}
            userID = {userID}
            cursors = {cursors}
            selections = {selections}/>
          <TextOutput
            side = 'right'
            ref = {this.outputRef}
            text = {codeOutput}
            onTextChange = {this.handleRightChange}
            userID = {userID}/>        
        </SplitPane>
      </div>
    )
  }
}

export default SplitText