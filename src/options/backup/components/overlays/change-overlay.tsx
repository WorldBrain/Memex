import React, { PureComponent } from 'react'
import Overlay from 'src/common-ui/components/overview-overlay'

interface Props {
    onClick: (action: string) => null
    disabled: boolean
}

export default class ChangeOverlay extends PureComponent<Props, {}> {
    render() {
        return (
            <Overlay
                disabled={this.props.disabled}
                header="Are you sure?"
                description={
                    'Changing your backup location will require a completely fresh backup which might take some time.'
                }
                continueButtonText="Yes, get started"
                continueButtonOnClick={() => this.props.onClick('yes')}
                cancelButtonText="Nope, get back"
                cancelButtonOnClick={() => this.props.onClick('nope')}
            />
        )
    }
}
