import React from 'react';
import {Toast} from 'react-bootstrap'
import {CommentRounded, HelpOutlineRounded} from '@material-ui/icons'
import './CSS/MyToast.css'

class MyToast extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show: true
        };
    }

    onClose = () => {
        this.setState({show: false});
        this.props.removeToastForNow(this.props.index);
    }

    render () {
        const {code, start, end, msg, type} = this.props.toast;
        const lines = end.row > start.row ? `lines ${start.row + 1} - ${end.row + 1}` : `line ${start.row + 1}`
        return (
            <Toast className='my-toast' show={this.state.show} onClose={this.onClose}>
            <Toast.Header className={type == 'comment' ? 'toast-header-comment' : 'toast-header-confused'} >
              {type == 'comment' ? <CommentRounded/> : <HelpOutlineRounded/>}
              <div className="toast-header-code" >{lines}</div>
              {/* <small>11 mins ago</small> */}
            </Toast.Header>
            <Toast.Body>
              <code >{code.map(line => <div>{line}</div>)}</code>

            {msg}
            </Toast.Body>
          </Toast>
        );
    }
    
}

export default MyToast;