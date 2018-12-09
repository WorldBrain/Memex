import React from 'react'

import { Checkbox } from 'src/common-ui/components'
import * as utils from '../../../sidebar-overlay/utils'

import styles from './settings.css'

class Ribbon extends React.Component {
    state = {
        ribbon: true,
    }

    async componentDidMount() {
        const ribbon = await utils.getSidebarState()
        this.setState({
            ribbon,
        })
    }

    toggleRibbon = async () => {
        const ribbon = !this.state.ribbon
        await utils.setSidebarState(ribbon)
        this.setState({ ribbon })
    }

    render() {
        return (
            <div className={styles.container}>
                <h1 className={styles.header}>Sidebar Ribbon</h1>
                <p className={styles.subHeader}>
                    Memex injects a small ribbon on the right side of every
                    page. <br /> If disabled, you can still reach it via the
                    little 'brain' icon in the popup.
                </p>
                <Checkbox
                    id="show-memex-ribbon"
                    isChecked={this.state.ribbon}
                    handleChange={this.toggleRibbon}
                >
                    Show ribbon on every page
                </Checkbox>
            </div>
        )
    }
}

export default Ribbon
