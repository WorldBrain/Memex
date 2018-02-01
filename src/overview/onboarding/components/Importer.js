import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { ProgressBar } from 'src/common-ui/components'
import localStyles from './Onboarding.css'

class Importer extends PureComponent {
    static propTypes = {
        progress: PropTypes.number.isRequired,
        children: PropTypes.node.isRequired,
    }

    render() {
        return (
            <div className={localStyles.container}>
                <ProgressBar progress={this.props.progress} />
                {this.props.children}
            </div>
        )
    }
}

export default Importer
