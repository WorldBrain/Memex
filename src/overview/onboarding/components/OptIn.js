import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import localStyles from './Onboarding.css'

class OptIn extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
    }

    render() {
        return (
            <div className={localStyles.optInContainer}>
                <p className={localStyles.message}>
                    Enable analytics tracking:
                </p>
                {this.props.children}
            </div>
        )
    }
}

export default OptIn
