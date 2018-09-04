import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import localStyles from './OptIn.css'

class OptIn extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
    }

    render() {
        return (
            <div className={localStyles.optInContainer}>
                <div className={localStyles.optInTextContainer}>
                    <p className={localStyles.optIn}>
                        Send anonymous usage statistics
                    </p>
                    <p className={localStyles.subOptIn}>
                        No keywords, no urls you visit; just interaction with
                        Memex.
                    </p>
                </div>
                {this.props.children}
            </div>
        )
    }
}

export default OptIn
