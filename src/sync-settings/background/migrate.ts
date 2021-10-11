import { STORAGE_KEYS as DASHBOARD_SETTING_NAMES } from 'src/dashboard-refactor/constants'
import {
    __OLD_HIDE_RESULTS_KEY,
    __OLD_SEARCH_INJECTION_KEY,
    __OLD_POSITION_KEY,
} from 'src/search-injection/constants'
import { STORAGE_KEY as BLOCKLIST_STORAGE_KEY } from 'src/options/blacklist/constants'
import { __OLD_INSTALL_TIME_KEY } from 'src/constants'
import { KEYBOARDSHORTCUTS_STORAGE_NAME } from 'src/in-page-ui/keyboard-shortcuts/constants'
import {
    TOOLTIP_STORAGE_NAME,
    HIGHLIGHTS_STORAGE_NAME,
    TRACKING_STORAGE_NAME,
} from 'src/in-page-ui/tooltip/constants'
import { SIDEBAR_STORAGE_NAME } from 'src/sidebar-overlay/constants'
import { __OLD_LAST_SHARED_ANNOTS } from 'src/annotations/utils'
import { SETTING_NAMES } from './constants'

export const localStorageToSettingsStorage = (values: {
    [name: string]: any
}): { [name: string]: any } => ({
    [SETTING_NAMES.contentSharing.lastSharedAnnotationTimestamp]:
        values[__OLD_LAST_SHARED_ANNOTS],
    [SETTING_NAMES.dashboard.listSidebarLocked]:
        values[DASHBOARD_SETTING_NAMES.__OLD_listSidebarLocked],
    [SETTING_NAMES.dashboard.onboardingMsgSeen]:
        values[DASHBOARD_SETTING_NAMES.__OLD_onboardingMsgSeen],
    [SETTING_NAMES.searchInjection.hideMemexResults]:
        values[__OLD_HIDE_RESULTS_KEY],
    [SETTING_NAMES.searchInjection.memexResultsPosition]:
        values[__OLD_POSITION_KEY],
    [SETTING_NAMES.searchInjection.searchEnginesEnabled]:
        values[__OLD_SEARCH_INJECTION_KEY],
    [SETTING_NAMES.pdfIntegration.shouldAutoOpen]: true,

    // TODO: These should be migrated over separately, when ready
    // [SETTING_NAMES.extension.blocklist]: values[BLOCKLIST_STORAGE_KEY],
    // [SETTING_NAMES.extension.keyboardShortcuts]:
    //     values[KEYBOARDSHORTCUTS_STORAGE_NAME],
    // [SETTING_NAMES.extension.shouldTrackAnalytics]:
    //     values[TRACKING_STORAGE_NAME],
    // [SETTING_NAMES.inPageUI.tooltipEnabled]: values[TOOLTIP_STORAGE_NAME],
    // [SETTING_NAMES.inPageUI.highlightsEnabled]: values[HIGHLIGHTS_STORAGE_NAME],
    // [SETTING_NAMES.inPageUI.ribbonEnabled]: values[SIDEBAR_STORAGE_NAME],
})
