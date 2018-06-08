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
                <div className={localStyles.optInTextContainer}>
                    <p className={localStyles.optIn}>
                        Send 100% private & anonymous usage statistics
                    </p>
                    <p className={localStyles.subOptIn}>
                        None of your history or searches, only interactions with
                        software
                    </p>
                </div>
            </div>
        )
    }
}

export default OptIn
