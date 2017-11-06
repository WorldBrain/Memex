import React from 'react'
import PropTypes from 'prop-types'

import DevOptions from '../DevOptionsContainer'
import { LoadingIndicator } from 'src/common-ui/components'
import localStyles from './Import.css'

const Warning = ({ children }) => (
    <div className={localStyles.warning}>
        <img src="/img/caution.png" className={localStyles.icon} />{' '}
        <p className={localStyles.warningText}>{children}</p>
    </div>
)

const Import = ({
    isLoading,
    loadingMsg,
    isIdle,
    isRunning,
    isStopped,
    isPaused,
    children,
}) => (
    <form>
        {(isIdle || isLoading) && (
            <div>
                <div className={localStyles.stepNumber}>
                    Step 1/3: Analysing Browser History and Bookmarks{' '}
                </div>
                <div className={localStyles.stepText}>
                    <p className={localStyles.stepImportText}>
                        If you want, you can also make your existing browsing
                        history and bookmarks available for full-text search.
                        Even without doing that, you still can search everything
                        you visit after installing the tool.
                    </p>
                    <Warning>
                        This process may slow down your internet connection.
                    </Warning>
                    <Warning>
                        Disabling Chrome's background tab throttling may improve
                        improve imports performance:
                        <br />
                        <code className={localStyles.warningCode}>
                            chrome://flags/#expensive-background-timer-throttling
                        </code>
                        <br />
                        Please use this option with care and reset to "Default"
                        when not importing.
                    </Warning>
                </div>
            </div>
        )}
        {(isRunning || isPaused) && (
            <div>
                <div className={localStyles.stepNumber}>
                    Step 2/3: Download Progress{' '}
                </div>
                <div className={localStyles.stepText}>
                    <img
                        src="/img/caution.png"
                        className={localStyles.icon}
                    />{' '}
                    If you leave this page, your import will paused. You can
                    always come back and resume where you left off.
                </div>
            </div>
        )}
        {isStopped && (
            <div className={localStyles.stepNumber}>
                Step 3/3: Status Report{' '}
            </div>
        )}
        <div className={localStyles.mainContainer}>
            <div className={localStyles.importTableContainer}>{children}</div>
            {isLoading && (
                <div className={localStyles.loadingBlocker}>
                    <p className={localStyles.loadingMsg}>{loadingMsg}</p>
                    <LoadingIndicator />
                </div>
            )}
        </div>
        {(isIdle || isLoading) && <DevOptions />}
    </form>
)

Warning.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

Import.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    isLoading: PropTypes.bool.isRequired,
    loadingMsg: PropTypes.string,
    isRunning: PropTypes.bool.isRequired,
    isIdle: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
}

export default Import
