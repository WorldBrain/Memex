import React from 'react'
import PropTypes from 'prop-types'

import AdvSettings from './AdvSettingsContainer'
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
    isStopped,
    shouldRenderEsts,
    shouldRenderProgress,
    children,
}) => (
    <form>
        {shouldRenderEsts && (
            <div>
                <div className={localStyles.stepNumber}>
                    Import your existing browsing history & bookmarks{' '}
                </div>
                <div className={localStyles.stepText}>
                    <Warning>
                        Re-downloading urls may slow down your web browsing.<br/>
                        With more than 10.000 links it is suggested to let this run overnight. 
                    </Warning>
                </div>
            </div>
        )}
        {shouldRenderProgress && (
            <div>
                <div className={localStyles.stepNumber}>
                    Import Progress{' '}
                </div>
                <div className={localStyles.warningContainer}>
                    <Warning>
                        The import may freeze because of a browser setting.<br/>
                        No need to worry. Go to{' '}
                        <a className={localStyles.link}
                            target="_blank"
                            href="http://memex.link/2Jw-R3BQh/worldbrain.helprace.com/i49-prevent-your-imports-from-stopping-midway"
                        >
                            <b>worldbrain.io/import_bug</b>
                        </a>{' '}
                        to fix it.
                    </Warning>
                </div>
            </div>
        )}
        {isStopped && (
            <div className={localStyles.stepNumber}>
                Status Report{' '}
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
        {shouldRenderEsts && <AdvSettings />}
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
    isStopped: PropTypes.bool.isRequired,
    shouldRenderEsts: PropTypes.bool.isRequired,
    shouldRenderProgress: PropTypes.bool.isRequired,
}

export default Import
