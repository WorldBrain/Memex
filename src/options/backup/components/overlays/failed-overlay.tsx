import React, { PureComponent } from 'react'
import Overlay from 'src/common-ui/components/overview-overlay'

interface Props {
    onClick: (action: string) => void
    disabled: boolean
}

export default class FailedOverlay extends PureComponent<Props, {}> {
    render() {
        return (
            <Overlay
                disabled={this.props.disabled}
                header="No data found in your selected folder"
                description={
                    'Change the folder location via the Memex Local App settings and then press continue.'
                }
                continueButtonText="Retry"
                continueButtonOnClick={() => this.props.onClick('continue')}
                cancelButtonText="Cancel"
                cancelButtonOnClick={() => this.props.onClick('cancel')}
            />
        )
    }
}
