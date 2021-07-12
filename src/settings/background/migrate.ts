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
    POSITION_STORAGE_NAME,
    HIGHLIGHTS_STORAGE_NAME,
    TRACKING_STORAGE_NAME,
} from 'src/in-page-ui/tooltip/constants'
import { SIDEBAR_STORAGE_NAME } from 'src/sidebar-overlay/constants'
import { LAST_SHARED_ANNOTS } from 'src/annotations/utils'

// TODO: set up some variables to hold these constant setting names
export const localStorageToSettingsStorage = (values: {
    [name: string]: any
}): { [name: string]: any } => ({
    '@ContentSharing-last_shared_annotation_timestamp':
        values[LAST_SHARED_ANNOTS],
    [DASHBOARD_SETTING_NAMES.listSidebarLocked]:
        values['@Dashboard-list_sidebar_locked'],
    [DASHBOARD_SETTING_NAMES.onboardingMsgSeen]:
        values['@Dashboard-onboarding_msg_seen'],
    [DASHBOARD_SETTING_NAMES.subBannerDismissed]:
        values['@Dashboard-subscribe_banner_dismissed'],
    '@SearchInjection-show_memex_results': values[HIDE_RESULTS_KEY],
    '@SearchInjection-memex_results_position': values[POSITION_KEY],
    '@SearchInjection-search_engines_enabled': values[SEARCH_INJECTION_KEY],
    '@PDFIntegration-should_auto_open': values[SHOULD_OPEN_STORAGE_KEY],
    '@Extension-blocklist': values[BLOCKLIST_STORAGE_KEY],
    '@Extension-install_time': values[INSTALL_TIME_KEY],
    '@Extension-keyboard_shortcuts': values[KEYBOARDSHORTCUTS_STORAGE_NAME],
    '@Extension-should_track_analytics': values[TRACKING_STORAGE_NAME],
    '@InPageUI-tooltip_enabled': values[TOOLTIP_STORAGE_NAME],
    '@InPageUI-tooltip_position': values[POSITION_STORAGE_NAME],
    '@InPageUI-highlights_enabled': values[HIGHLIGHTS_STORAGE_NAME],
    '@InPageUI-ribbon_enabled': values[SIDEBAR_STORAGE_NAME],
})
