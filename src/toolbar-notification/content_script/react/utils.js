export const getExtURL = location =>
    browser.extension ? browser.extension.getURL(location) : location
