import React from 'react';
import {Toast} from 'react-bootstrap'
import {CommentRounded} from '@material-ui/icons'

class MyToast extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show: true
        };
    }

    render () {
        const {code, start, end, msg, type} = this.props.toast;
        return (
            <Toast show={this.state.show} onClose={() => this.setState({show: false})}>
            <Toast.Header>
              <CommentRounded/>
              <strong className="mr-auto">{code.map(line => <div>{line}</div>)}</strong>
              {/* <small>11 mins ago</small> */}
            </Toast.Header>
            <Toast.Body>{msg}</Toast.Body>
          </Toast>
        );
    }
    
}

export default MyToast;