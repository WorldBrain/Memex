import React from 'react'

import Checkbox from './Checkbox'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import {
    TOOLTIP_STORAGE_NAME,
    TOOLTIP_DEFAULT_OPTION,
} from 'src/content-tooltip/constants'

import styles from './settings.css'

class Tooltip extends React.Component {
    state = {
        tooltip: true,
    }

    async componentDidMount() {
        const tooltip = await getLocalStorage(
            TOOLTIP_STORAGE_NAME,
            TOOLTIP_DEFAULT_OPTION,
        )
        this.setState({
            tooltip,
        })
    }

    toggleTooltip = async () => {
        const tooltip = !this.state.tooltip
        await setLocalStorage(TOOLTIP_STORAGE_NAME, tooltip)
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
