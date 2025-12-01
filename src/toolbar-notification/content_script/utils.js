export const getExtURL = (location) =>
    chrome.extension ? chrome.runtime.getURL(location) : location
