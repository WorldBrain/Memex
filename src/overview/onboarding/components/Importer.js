import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { ProgressBar } from 'src/common-ui/components'
import localStyles from './Onboarding.css'

class Importer extends PureComponent {
    static propTypes = {
        isImportsDone: PropTypes.bool.isRequired,
        progress: PropTypes.number.isRequired,
    }

    renderMsg() {
        if (this.props.isImportsDone) {
            return (
                <p className={localStyles.importMsg}>
                    Memex is ready! Click here to start.
                </p>
            )
        }

        return (
            <p className={localStyles.importMsg}>
                Please wait a moment while Memex prepares...
            </p>
        )
    }

    render() {
        return (
            <div className={localStyles.container}>
                <ProgressBar progress={this.props.progress} />
                {this.renderMsg()}
            </div>
        )
    }
}

export default Importer
