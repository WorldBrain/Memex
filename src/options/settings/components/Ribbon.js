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
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Website Sidebar</div>
                <div className={styles.infoText}>
                    You can open the sidebar via the Memex icon in the browser
                    extensions menu or by moving your mouse to the right side of
                    the screen.
                </div>
                <Checkbox
                    id="show-memex-ribbon"
                    isChecked={this.state.ribbon}
                    handleChange={this.toggleRibbon}
                >
                    Enable
                </Checkbox>
            </div>
        )
    }
}

export default Ribbon
