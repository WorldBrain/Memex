export const isExtensionTab = (tab: { url: string }): boolean =>
    tab.url.startsWith('chrome-extension://') ||
    tab.url.startsWith('moz-extension://')
