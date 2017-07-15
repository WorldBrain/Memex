import React, { Component } from 'react'

import Popup from './components/Popup'
import Button from './components/Button'
import LinkButton from './components/LinkButton'

class PopupContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            searchValue: '',
        }
    }

    render() {
        return (
            <Popup searchValue={this.state.searchValue}>
                <LinkButton href='options/options.html#/settings' icon='settings'>
                    Settings
                </LinkButton>
                <LinkButton href='https://www.reddit.com/r/WorldBrain/' icon='feedback'>
                    Feedback
                </LinkButton>
                <LinkButton href='options/options.html#/import' icon='file_download'>
                    Import History &amp; Bookmarks
                </LinkButton>
                <Button icon='archive'>
                    Archive Current Page
                </Button>
            </Popup>
        )
    }
}

export default PopupContainer
