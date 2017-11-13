import React, { Component } from 'react'
import ReactDOM from 'react-dom'

class ShareButtons extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div
                className="a2a_kit a2a_kit_size_32 a2a_floating_style a2a_vertical_style"
                style="left:0px; top:150px;"
            >
                <a className="a2a_button_facebook" />
                <a className="a2a_button_twitter" />
                <a className="a2a_button_google_plus" />
                <a className="a2a_button_pinterest" />
                <a className="a2a_dd" href="https://www.addtoany.com/share" />
            </div>
        )
    }
}
export default ShareButtons
