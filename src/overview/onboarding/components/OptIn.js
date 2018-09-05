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
                    <p className={localStyles.optIn}>HELP IMPROVING MEMEX</p>
                    <p className={localStyles.subOptIn}>
                        Share non-personal & anonymous interaction data.{' '}
                        <a href="https://worldbrain.io/privacy-policy/">
                            (Full Privacy Policy)
                        </a>
                    </p>
                </div>
                {this.props.children}
            </div>
        )
    }
}

export default OptIn
