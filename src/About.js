import React from "react";
import './About.css';

function About(props) {
    return (
    <iframe title="aboutPDF" src="/about.pdf" type="application/pdf" class="full-pdf" />
    );
}

export default About;