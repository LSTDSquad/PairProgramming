import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { PeopleAltRounded } from "@material-ui/icons";
import "./TeammateCount.css";

/**
 * used to show how many people are on the session and who 
 * @param {UserArray} param0 
 * userArray is an array of {id, firstname}
 */

const TeammateCount = ({ userArray }) => {
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
          <PeopleAltRounded className="teammates-icon" />
        </div>

      </OverlayTrigger>
    </>
  );
};
export default TeammateCount;
