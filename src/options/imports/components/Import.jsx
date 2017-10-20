import React from 'react'
import PropTypes from 'prop-types'

import DevOptions from '../DevOptionsContainer'
import { LoadingIndicator } from 'src/common-ui/components'
import localStyles from './Import.css'

const Import = ({
    isLoading,
    loadingMsg,
    isIdle,
    isRunning,
    isStopped,
    isPaused,
    children,
}) => (
    <div>
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
                    <img
                        src="/img/caution.png"
                        className={localStyles.icon}
                    />{' '}
                    This process may slow down your internet connection.
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
                    If you leave this page, your import will paused.<br />
                    <span className={localStyles.stepSubText}>
                        You can always come back and resume where you left off.
                    </span>
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
    </div>
)

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
