import React, { useState, useRef } from "react";
import { Overlay,  Tooltip, Button } from "react-bootstrap";

/*
THIS COMPONENT USES REACT HOOKS! 
*/
/*
EXAMPLE USAGE:
<HoverClickPopover 
        onHidePopover={() => this.basicSetState({ confusedMsg: "", showConfused: false})}
        popover={this.getConfusedPopover} //MUST BE A FUNCTION
        variant="danger"
        buttonClass="confused-btn"
        showPopover={this.state.showConfused} //to close the confused popover once submitted. 
        hoverContent={<div>Click to ask your partner a question about the code</div>}
        showPopover={this.state.showConfused}
        buttonContent={<HelpOutlineRounded/>}
        onClick={() => this.setState({showConfused: true})}
        />
*/

const HoverClickPopover = props => {
  const { usePopoverStateOutside } = props;
  let [showPopover, setShowPopover] = useState(false);

  //if you're using state outside like the confusion button
  if (usePopoverStateOutside) {
    showPopover = props.showPopover;
  }
  const [showHover, setShowHover] = useState(false);
  const target = useRef(null);
  let thisProps = props;

  return (
    <>
      <Button
        ref={target}
        variant={props.variant}
        className={props.buttonClass}
        onClick={() => {
          usePopoverStateOutside ? props.onClick() : setShowPopover(true);
        }}
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
      >
        {props.buttonContent}
      </Button>
      <Overlay
        target={target.current}
        show={showHover && !showPopover}
        placement={props.placement || "right"}
      >
        {({ ...props }) => (
          <Tooltip {...props}>{thisProps.hoverContent}</Tooltip>
        )}
      </Overlay>
      <Overlay
        target={target.current}
        show={showPopover}
        placement="right"
        rootClose={true}
        onHide={() => {
          usePopoverStateOutside
            ? props.onHidePopover()
            : setShowPopover(false);
        }}
      >
        {props => thisProps.popover(props)}
      </Overlay>
    </>
  );
};
export default HoverClickPopover;
