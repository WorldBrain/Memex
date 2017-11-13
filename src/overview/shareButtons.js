import React, { Component } from 'react'
import ReactDOM from 'react-dom'

class ShareButtons extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div>
                <img
                    style={{
                        right: 45,
                        top: 150,
                    }}
                    src="/img/face.png"
                />
            </div>
        )
    }
}
ReactDOM.render(<ShareButtons />, document.getElementById('dab'))
export default ShareButtons
