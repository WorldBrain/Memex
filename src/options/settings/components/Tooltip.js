import React from 'react'

import Checkbox from './Checkbox'
import { getTooltipState, setTooltipState } from 'src/content-tooltip/utils'

import styles from './Settings.css'

class Tooltip extends React.Component {
    state = {
        tooltip: true,
    }

    async componentDidMount() {
        const tooltip = await getTooltipState()
        this.setState({ tooltip })
    }

    toggleTooltip = async () => {
        const tooltip = !this.state.tooltip
        await setTooltipState(tooltip)
        this.setState({ tooltip })
    }

    render() {
        return (
            <div className={styles.container}>
                <h1 className={styles.header}>Memex.Link</h1>
                <p className={styles.subText}>
                    With Memex.Links you can highlight any piece of text on the
                    web and share a link to it.{' '}
                    <a
                        className={styles.subTextLink}
                        target="_blank"
                        href="https://worldbrain.helprace.com/i62-feature-memex-links-highlight-any-text-and-create-a-link-to-it"
                    >
                        More Information
                    </a>
                </p>
                <Checkbox
                    id="show-memex-link"
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
