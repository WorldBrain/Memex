const localServer =
    process.env.NODE_ENV === 'production'
        ? 'http://localhost:11922'
        : 'http://localhost:11922'

export const LOCAL_SERVER_ROOT = localServer

export const LOCAL_SERVER_ENDPOINTS = {
    STATUS: `${LOCAL_SERVER_ROOT}/status`,
    LOCATION: `${LOCAL_SERVER_ROOT}/backup/location`,
    CHANGE_LOCATION: `${LOCAL_SERVER_ROOT}/backup/start-change-location`,
}
