import React from 'react'

import Checkbox from './Checkbox'
import { getTooltipState, setTooltipState } from 'src/content-tooltip/utils'

import styles from './settings.css'

class Tooltip extends React.Component {
    state = {
        tooltip: true,
    }

    async componentDidMount() {
        const tooltip = await getTooltipState()
        this.setState({
            tooltip,
        })
    }

    toggleTooltip = async () => {
        const tooltip = !this.state.tooltip
        await setTooltipState(tooltip)
        this.setState({
            tooltip,
        })
    }

    render() {
        return (
            <div>
                <p className={styles.settingsHeader}>Memex.Link</p>
                <Checkbox
                    isChecked={this.state.tooltip}
                    handleChange={this.toggleTooltip}
                >
                    Show tooltip on every page
                </Checkbox>
            </div>
        )
    }
}

export default Tooltip
