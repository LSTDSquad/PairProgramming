import React, { useState } from "react";
import { Toast } from "react-bootstrap";
import { CommentRounded, HelpOutlineRounded } from "@material-ui/icons";
import "./MyToast.css";

/**
 * Toast for when people post a comment or a confusion. 
 * This may be deprecated in order to be used in a chat window. 
 * Example:
 * <MyToast
    key={i} // just because it's part of a list 
    index={i} // for closing the toast.
    removeToastForNow={this.removeToastForNow}
    toast={toast}
  />
 */
function MyToast({ _, index, removeToastForNow, toast }) {
  let [show, setShow] = useState(true);

  const onClose = () => {
    setShow(false);
    removeToastForNow(index);
  };

  const { code, start, end, msg, type } = toast;
  const lines =
    end.row > start.row
      ? `lines ${start.row + 1} - ${end.row + 1}`
      : `line ${start.row + 1}`;
  return (
    <Toast className="my-toast" show={show} onClose={onClose}>
      <Toast.Header
        className={
          type === "comment" ? "toast-header-comment" : "toast-header-confused"
        }
      >
        {type === "comment" ? <CommentRounded /> : <HelpOutlineRounded />}
        <div className="toast-header-code">{lines}</div>
      </Toast.Header>
      <Toast.Body>
        <code>
          {code.map((line, i) => (
            <div key={i} >{line}</div>
          ))}
        </code>

        {msg}
      </Toast.Body>
    </Toast>
  );
}

export default MyToast;
