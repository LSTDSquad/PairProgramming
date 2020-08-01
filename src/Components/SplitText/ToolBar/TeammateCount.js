import React from "react";
import { Button, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { PeopleAltRounded } from "@material-ui/icons";
import "./TeammateCount.css";

const TeammateCount = props => {
  const { userArray } = props;
  const TeammateTooltip = (
    <Tooltip>
      {userArray.map(({ id, name }) => {
        return <div key={id} >{name}</div>;
      })}
    </Tooltip>
  );

  return (
    <>
      <OverlayTrigger
        trigger={["hover", "focus"]}
        overlay={TeammateTooltip}
        placement="bottom"
      >
              <div className="teammates-container">
          <span className="teammates-number">{userArray.length}</span>
          <PeopleAltRounded className="teammates-icon" fontSize="medium" />
        </div>
        
      </OverlayTrigger>
    </>
  );
};
export default TeammateCount;
