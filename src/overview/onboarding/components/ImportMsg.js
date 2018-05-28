import React, { PureComponent } from 'react'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './Onboarding.css'

class ImportMsg extends PureComponent {
    static propTypes = {
        isImportsDone: PropTypes.bool.isRequired,
        onCancel: PropTypes.func.isRequired,
        onFinish: PropTypes.func.isRequired,
    }

    renderFinishMsg = () => (
        <span className={localStyles.choiceBtnContainer}>
            <p className={localStyles.readyMsg}>Memex is ready!</p>
            <br />
            <a
                className={cx(localStyles.choiceBtn, localStyles.startBtn)}
                onClick={this.props.onFinish}
                type="button"
            >
                Get Started
            </a>
            or
            <Link className={localStyles.choiceBtn} type="button" to="/import">
                Import Rest of History
            </Link>
        </span>
    )

    renderCancellableMsg = () => (
        <span className={localStyles.choiceBtnContainer}>
            <p className={localStyles.prepareMsg}>
                Importing the last 30 pages you visited,<br />so you can play
                around immediately
            </p>
            <a
                className={localStyles.cancelBtn}
                onClick={this.props.onCancel}
                type="button"
            >
                Skip This
            </a>
        </span>
    )

    render() {
        if (this.props.isImportsDone) {
            return this.renderFinishMsg()
        }

        return this.renderCancellableMsg()
    }
}

export default ImportMsg
