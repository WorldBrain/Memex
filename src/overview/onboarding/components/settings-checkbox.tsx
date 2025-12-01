import React from 'react'

import Checkbox, { CheckboxToggle } from 'src/common-ui/components/Checkbox'

export interface Props {
    id: string
    isChecked: boolean
    handleChange: CheckboxToggle
}

export default class SettingsCheckbox extends React.PureComponent<Props> {
    render() {
        return (
            <div className="container">
                <Checkbox labelClass="center" {...this.props} />
            </div>
        )
    }
}
