import React, { useEffect, useState } from "react";
import "./TextOutput.css";

/**
 * 
 * @param {*} param0 
 * example usage:
 * <TextOutput
    side="right"
    text={codeOutput}
    onTextChange={this.handleTextChange} //unused 
    userID={userID}
    waitingForInput={this.state.waitingForInput}
  />
 */
function TextOutput({ waitingForInput, text}) {
  let [inputVal, setInputVal] = useState("");

  useEffect(() => {
    if (!waitingForInput && inputVal) {
      setInputVal("");
    }
  });

  const handleInputChange = e => {
    setInputVal(e.target.value);
  };

  const listItems = text.map((text, i) => (
    <div
      key={i}
      //it's white for regular, green for input, red for error
      style={{
        color:
          text.indexOf("Error: ") >= 0
            ? "red"
            : text.indexOf(">") === 0
              ? "#28a745"
              : "white"
        ,
        wordWrap: "break-word"
      }}
    >
      {text}
    </div>
  ));

  //maybe change the cursor 
  return (
    <div className="output-text">
      {listItems}
      <textarea
        style={{ display: waitingForInput ? "inherit" : "none" }}
        id="std-input"
        className="std-input"
        value={inputVal}
        onChange={handleInputChange}
      />
    </div>
  );
}

export default TextOutput;
