export const ANNOTATION_DEMO_URL = 'https://en.wikipedia.org/wiki/Memex'
export const BACKUP_URL = '/options.html#/backup'

export const STORAGE_KEYS = {
    shouldShowOnboarding: 'should-show-onboarding',
    onboardingFlows: {
        annotation: 'step-one-annotations',
        powerSearch: 'step-two-power-search',
        tagging: 'step-three-tagging',
        backup: 'step-four-backup',
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
