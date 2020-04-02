import React from "react";
import { Overlay } from "react-bootstrap";
import $ from 'jquery'

class MarkerPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { show: false };
  }

  render() {
    return (
      <Overlay
        ref={overlay => (this.overlay = overlay)}
        target={() => this.props.overlayTarget}
        container={$("#editor")[0]}
        placement={this.props.overlayPlacement}
        rootClose={true}
        onHide={() => this.setState({ show: false })}
        show={this.state.show}
      >
        {this.props.children}
      </Overlay>
    );
  }
}
export default MarkerPopup;