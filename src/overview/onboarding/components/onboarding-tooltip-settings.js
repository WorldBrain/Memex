import React from 'react'

// import Checkbox from './Checkbox'
import { Checkbox } from 'src/common-ui/components'
import * as utils from 'src/content-tooltip/utils'

import styles from './settings.css'

class OnboardingTooltipSettings extends React.Component {
    state = {
        tooltip: true,
    }

    async componentDidMount() {
        const tooltip = await utils.getTooltipState()
        this.setState({ tooltip })
    }

    toggleTooltip = async () => {
        const tooltip = !this.state.tooltip
        await utils.setTooltipState(tooltip)
        this.setState({ tooltip })
    }

    render() {
        return (
            <div className={styles.container}>
                <Checkbox
                    id="show-memex-link"
                    isChecked={this.state.tooltip}
                    handleChange={this.toggleTooltip}
                >
                    Show tool tip when highlighting content online
                </Checkbox>
            </div>
        )
    }
}

export default OnboardingTooltipSettings
