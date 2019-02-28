import React, { PureComponent, Fragment } from 'react'

import Overlay from 'src/common-ui/components/overview-overlay'
import { OverlayProps as Props } from './types'

export default class ChangeOverlay extends PureComponent<Props, {}> {
    render() {
        return (
            <Overlay
                disabled={this.props.disabled}
                header="Make sure you copy your files before you continue"
                description={
                    <Fragment>
                        If you don't want to redo the whole backup, make sure
                        you copied
                        <br />
                        the existing backup files into the new folder you
                        selected.
                    </Fragment>
                }
                continueButtonText="I copied them over"
                continueButtonOnClick={() => this.props.onClick('copied')}
                cancelButtonText="Start New Backup"
                cancelButtonOnClick={() => this.props.onClick('newbackup')}
            />
        )
    }
}
