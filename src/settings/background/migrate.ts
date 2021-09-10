import { STORAGE_KEYS as DASHBOARD_SETTING_NAMES } from 'src/dashboard-refactor/constants'
import {
    HIDE_RESULTS_KEY,
    SEARCH_INJECTION_KEY,
    POSITION_KEY,
} from 'src/search-injection/constants'
import { SHOULD_OPEN_STORAGE_KEY } from 'src/options/PDF/constants'
import { STORAGE_KEY as BLOCKLIST_STORAGE_KEY } from 'src/options/blacklist/constants'
import { INSTALL_TIME_KEY } from 'src/constants'
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
    [SETTING_NAMES.dashboard.subscribeBannerDismissed]:
        values[DASHBOARD_SETTING_NAMES.__OLD_subBannerDismissed],
    [SETTING_NAMES.searchInjection.showMemexResults]: values[HIDE_RESULTS_KEY],
    [SETTING_NAMES.searchInjection.memexResultsPosition]: values[POSITION_KEY],
    [SETTING_NAMES.searchInjection.searchEnginesEnabled]:
        values[SEARCH_INJECTION_KEY],
    [SETTING_NAMES.pdfIntegration.shouldAutoOpen]:
        values[SHOULD_OPEN_STORAGE_KEY],
    [SETTING_NAMES.extension.blocklist]: values[BLOCKLIST_STORAGE_KEY],
    [SETTING_NAMES.extension.installTime]: values[INSTALL_TIME_KEY],
    [SETTING_NAMES.extension.keyboardShortcuts]:
        values[KEYBOARDSHORTCUTS_STORAGE_NAME],
    [SETTING_NAMES.extension.shouldTrackAnalytics]:
        values[TRACKING_STORAGE_NAME],
    [SETTING_NAMES.inPageUI.tooltipEnabled]: values[TOOLTIP_STORAGE_NAME],
    [SETTING_NAMES.inPageUI.highlightsEnabled]: values[HIGHLIGHTS_STORAGE_NAME],
    [SETTING_NAMES.inPageUI.ribbonEnabled]: values[SIDEBAR_STORAGE_NAME],
})
