export const DEFAULT_SHADOW_ROOT_ID = 'memex-ribbon-sidebar-container'

export const BASE_PATH = process.env.PWD
export const EXT_PATH_PACKED = BASE_PATH + '/dist/extension.zip'
export const EXT_PATH_UNPACKED = BASE_PATH + '/extension'
export const EXT_URL_CHROME =
    'chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/'
export const EXT_URL_FF =
    'moz-extension://82af4cbb-64ef-2344-ab60-1dafe96835ff/' // TODO: This is not static
export const OVERVIEW_PATH = '/options.html#/overview'
export const EXT_OVERVIEW_URL = EXT_URL_CHROME + OVERVIEW_PATH
