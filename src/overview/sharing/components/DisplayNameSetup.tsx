import React, { PureComponent } from 'react'

interface DisplayNameSetupProps {
    name: string
    onChange: (newName: string) => void
    onClickNext: () => void
}

export default class DisplayNameSetup extends PureComponent<
    DisplayNameSetupProps
> {
    render() {
        return (
            <div>
                <div>Setup your display name</div>
                <div>
                    This is how people know who the shared content is from
                </div>

                <input
                    value={this.props.name || ''}
                    onChange={(e) => this.props.onChange(e.target.value)}
                />

                <button onClick={this.props.onClickNext}>Next</button>
            </div>
        )
    }
}
