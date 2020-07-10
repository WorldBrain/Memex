import React, { PureComponent } from 'react'

interface ShareNonPioneerInfoProps {
    onClickUpgrade: () => void
}

export default class ShareNonPioneerInfo extends PureComponent<
    ShareNonPioneerInfoProps
> {
    render() {
        return (
            <div>
                <div>This is a beta feature</div>
                <div>
                    For now, this feature is only available to Pioneer
                    supporters
                </div>
                <div>
                    Memex is built on a strong foundation to take no VC money to
                    protect your data & privacy.  Early supporters like you make
                    this journey possible.
                </div>
                <button onClick={this.props.onClickUpgrade}>Upgrade</button>
            </div>
        )
    }
}
