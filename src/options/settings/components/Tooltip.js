import React from 'react'

// import Checkbox from './Checkbox'
import { Checkbox } from 'src/common-ui/components'
import * as utils from 'src/content-tooltip/utils'

import styles from './settings.css'

class Tooltip extends React.Component {
    state = {
        tooltip: true,
        position: 'mouse',
    }

    async componentDidMount() {
        const tooltip = await utils.getTooltipState()
        const position = await utils.getPositionState()
        this.setState({
            tooltip,
            position,
        })
    }

    toggleTooltip = async () => {
        const tooltip = !this.state.tooltip
        await utils.setTooltipState(tooltip)
        this.setState({ tooltip })
    }

    togglePosition = async e => {
        const position = e.target.value
        await utils.setPositionState(position)
        this.setState({ position })
    }

    render() {
        console.log(this.state)
        return (
            <div className={styles.container}>
                <h1 className={styles.header}>Annotation Toolip</h1>
                <p className={styles.subHeader}>
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
                <Checkbox
                    id="position-memex-link"
                    isChecked={this.state.tooltip}
                    handleChange={() => null}
                >
                    Position tooltip below
                    <select
                        className={styles.dropdown}
                        value={this.state.position}
                        onChange={this.togglePosition}
                    >
                        <option value="mouse">mouse pointer</option>
                        <option value="text">selected text</option>
                    </select>
                </Checkbox>
            </div>
        )
    }
}

export default Tooltip
