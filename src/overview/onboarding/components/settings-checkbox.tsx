import React from 'react'

import { Checkbox, CheckboxToggle } from 'src/common-ui/components'
const styles = require('./settings.css')

export interface Props {
    id: string
    isChecked: boolean
    handleChange: CheckboxToggle
}

export default class SettingsCheckbox extends React.PureComponent<Props> {
    render() {
        return (
            <div className={styles.container}>
                <Checkbox labelClass={styles.center} {...this.props} />
            </div>
        )
    }
}
