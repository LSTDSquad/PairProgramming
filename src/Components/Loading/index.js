import React from "react"
import {Spinner, Container} from "react-bootstrap"

const Loading = props => {
    return (
        <Container
        fluid
        className="vh-100 d-flex flex-column justify-content-center align-items-center"
      >
        <div>
          <Spinner animation="grow" variant="warning" />
          <Spinner animation="grow" variant="danger" />
          <Spinner animation="grow" variant="primary" />
        </div>
        <h1 className="h1">Loading</h1>
      </Container>
    )
}
export default Loading;