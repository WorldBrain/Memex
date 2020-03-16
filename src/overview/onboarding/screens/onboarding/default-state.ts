import { VISIT_DELAY_RANGE } from 'src/options/settings/constants'
import { State } from './logic'

export const getDefaultState = () =>
    ({
        visitDelay: VISIT_DELAY_RANGE.DEF,
        currentStep: 0,
        isTooltipEnabled: true,
        isSidebarEnabled: true,
        isTrackingEnabled: true,
        areShortcutsEnabled: true,
        areStubsEnabled: true,
        areVisitsEnabled: true,
        areBookmarksEnabled: true,
        areAnnotationsEnabled: true,
        areScreenshotsEnabled: false,
        areCollectionsEnabled: true,
        showSearchSettings: false,
    } as State)
