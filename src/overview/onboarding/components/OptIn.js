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
                {this.props.children}
                <p className={localStyles.OptIn}>
                    Send 100% private & anonymous usage statistics
                    <p className={localStyles.SubOptIn}>
                        None of your history or searches, only interactions with
                        software
                    </p>
                </p>
            </div>
        )
    }
}

export default OptIn
