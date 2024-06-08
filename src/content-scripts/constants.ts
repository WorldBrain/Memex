export const SIDEBAR_SEARCH_RESULT_LIMIT = 10

export const IGNORE_CLICK_OUTSIDE_CLASS = 'ignore-react-onclickoutside'

export const ONBOARDING_NUDGES_STORAGE = '@onboarding-nudges'

export const ONBOARDING_NUDGES_DEFAULT = {
    enabled: true, // should the onboarding nudge be shown at all
    bookmarksCount: 4, // how many times a page has been scrolled down
    youtubeSummaryCount: 4, // how many times a youtube video has been opened
    youtubeTimestampCount: 0, // how many times a youtube video has been opened
    pageSummaryCount: 0, // how many times did the user encounter a long article worth summarising
}
export const ONBOARDING_NUDGES_MAX_COUNT = {
    bookmarksCount: 5, // how many times a page has been scrolled down
    youtubeSummaryCount: 5, // how many times a youtube video has been opened
    youtubeTimestampCount: 0, // how many times a youtube video has been opened
    pageSummaryCount: 0, // how many times did the user encounter a long article worth summarising
}
