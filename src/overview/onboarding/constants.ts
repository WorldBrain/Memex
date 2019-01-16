export const ANNOTATION_DEMO_URL = 'https://en.wikipedia.org/wiki/Memex'
export const BACKUP_URL = '/options.html#/backup'

/**
 * Constant to store the names of different onboarding workflows.
 */
export const FLOWS = {
    annotation: 'annotation',
    powerSearch: 'powerSearch',
    tagging: 'tagging',
    backup: 'backup',
}

export const STORAGE_KEYS = {
    shouldShowOnboarding: 'should-show-onboarding',
    onboardingFlows: {
        [FLOWS.annotation]: 'step-one-annotations',
        [FLOWS.powerSearch]: 'step-two-power-search',
        [FLOWS.tagging]: 'step-three-tagging',
        [FLOWS.backup]: 'step-four-backup',
    },
}

/**
 * Constants to store the stages of all onboarding flows.
 * Stages are stored in each of onboarding flow's storage key.
 * They denote which stage the user is in the current onboarding flow.
 *
 * Still skeptical about the naming of the attributes/values.
 */
export const STAGES = {
    unvisited: 'unvisited',
    redirected: 'redirected',
    done: 'DONE',
    annotation: {
        notifiedHighlightText: 'highlight-text-notification-shown',
        notifiedSelectOption: 'select-option-notification-shown',
        annotationCreated: 'annotation-created',
    },
    powerSearch: {
        notifiedBrowsePage: 'power-search-browse-shown',
        overviewTooltips: 'overview-tooltips',
        skipToTimeFilters: 'skip-to-time-filters',
    },
    tagging: {
        notifiedTagPage: 'tag-page-notification-shown',
    },
}
