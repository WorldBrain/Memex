import { TOOLTIP_DEFAULT_OPTION } from 'src/in-page-ui/tooltip/constants'
import { VISIT_DELAY_RANGE } from 'src/options/settings/constants'
import { State } from './logic'

export const getDefaultState = () =>
    ({
        visitDelay: VISIT_DELAY_RANGE.DEF,
        currentStep: 0,
        isTooltipEnabled: TOOLTIP_DEFAULT_OPTION,
        isSidebarEnabled: false,
        isTrackingEnabled: true,
        areShortcutsEnabled: false,
        areStubsEnabled: false,
        areVisitsEnabled: false,
        areBookmarksEnabled: true,
        areAnnotationsEnabled: true,
        areScreenshotsEnabled: false,
        areCollectionsEnabled: true,
        showSearchSettings: false,
    } as State)
