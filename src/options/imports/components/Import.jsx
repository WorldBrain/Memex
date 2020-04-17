import React from 'react'
import PropTypes from 'prop-types'

import AdvSettings from './AdvSettingsContainer'
import { LoadingIndicator } from 'src/common-ui/components'
import localStyles from './Import.css'
import { IMPORT_TYPE } from '../constants'
import settingsStyle from 'src/options/settings/components/settings.css'

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
    allowTypes,
}) => (
    <div>
        <div className={settingsStyle.section}>
            {shouldRenderEsts && (
                <div>
                    <div className={settingsStyle.sectionTitle}>
                        Import urls from other services
                    </div>
                    <div className={localStyles.stepText}>
                        <Warning>
                            Re-downloading urls may slow down your web browsing.
                            <br />
                            With more than 10.000 links it is suggested to let
                            this run overnight.
                        </Warning>
                    </div>
                </div>
            )}
            {shouldRenderProgress && (
                <div>
                    <div className={settingsStyle.sectionTitle}>
                        Import Progress
                    </div>
                    <div className={localStyles.stepText}>
                        <Warning>
                            The import may freeze because of a browser setting.
                            Go to{' '}
                            <a
                                className={localStyles.link}
                                target="_blank"
                                href="http://memex.link/2Jw-R3BQh/worldbrain.helprace.com/i49-prevent-your-imports-from-stopping-midway"
                            >
                                <b>worldbrain.io/import_bug</b>
                            </a>{' '}
                            to fix it.
                            <br />
                            It can also happen that virtually all URLs fail.
                            Restart your extension and start over.
                        </Warning>
                    </div>
                </div>
            )}
            {isStopped && (
                <div className={settingsStyle.sectionTitle}>Import Report</div>
            )}
            <div className={localStyles.mainContainer}>
                <div className={localStyles.importTableContainer}>
                    {children}
                </div>
                {isLoading && !allowTypes[IMPORT_TYPE.OTHERS].length && (
                    <div className={localStyles.loadingBlocker}>
                        <p className={localStyles.loadingMsg}>{loadingMsg}</p>
                        <LoadingIndicator />
                    </div>
                )}
            </div>
        </div>
        {shouldRenderEsts && (
            <div className={settingsStyle.section}>
                <AdvSettings />
            </div>
        )}
    </div>
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
    allowTypes: PropTypes.object.isRequired,
}

export default Import
