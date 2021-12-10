export const getExtURL = (location) =>
    browser.extension ? browser.runtime.getURL(location) : location
