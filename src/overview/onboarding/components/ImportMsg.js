import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import localStyles from './Onboarding.css'

class ImportMsg extends PureComponent {
    static propTypes = {
        onClick: PropTypes.func.isRequired,
        children: PropTypes.string.isRequired,
    }

    render() {
        return (
            <p className={localStyles.importMsg} onClick={this.props.onClick}>
                {this.props.children}
            </p>
        )
    }
}

export default ImportMsg
