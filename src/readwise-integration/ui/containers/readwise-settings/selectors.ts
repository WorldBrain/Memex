import { ReadwiseSettingsState } from './types'

export function showLoadingError(state: ReadwiseSettingsState) {
    return state.loadState === 'error'
}

export function showUnauthorized(state: ReadwiseSettingsState) {
    return state.loadState === 'success' && !state.isFeatureAuthorized
}

export function showForm(state: ReadwiseSettingsState) {
    return (
        !showLoadingError(state) &&
        !showUnauthorized(state) &&
        (state.syncState === 'pristine' || state.syncState === 'success')
    )
}

export function apiKeyDisabled(state: ReadwiseSettingsState) {
    return !formEditable(state)
}

export function showSyncScreen(state: ReadwiseSettingsState) {
    return (
        !showUnauthorized(state) &&
        !showLoadingError(state) &&
        !showForm(state) &&
        state.loadState === 'success'
    )
}

export function showSyncError(state: ReadwiseSettingsState) {
    return showSyncScreen(state) && state.syncState === 'error'
}

export function showSyncRunning(state: ReadwiseSettingsState) {
    return showSyncScreen(state) && state.syncState === 'running'
}

export function formEditable(state: ReadwiseSettingsState) {
    return showForm(state) && state.apiKeyEditable
}

export function showKeySaveButton(state: ReadwiseSettingsState) {
    return showForm(state) && state.apiKeyEditable && !!state.apiKey?.length
}

export function showKeySaving(state: ReadwiseSettingsState) {
    return showForm(state) && state.keySaveState === 'running'
}

export function showKeyRemoveButton(state: ReadwiseSettingsState) {
    return (
        showForm(state) &&
        !state.apiKeyEditable &&
        state.keySaveState !== 'running'
    )
}

export function showKeySaveError(state: ReadwiseSettingsState) {
    return showForm(state) && state.keySaveState === 'error'
}

export function keySaveErrorMessage(state: ReadwiseSettingsState) {
    return showForm(state) && state.keySaveState === 'error'
        ? state.keySaveError ?? 'Something went wrong saving your API key'
        : ''
}

export function showKeySuccessMessage(state: ReadwiseSettingsState) {
    return (
        showForm(state) &&
        state.keySaveState === 'success' &&
        state.syncState === 'pristine'
    )
}

export function showSyncSuccessMessage(state: ReadwiseSettingsState) {
    return (
        showForm(state) &&
        state.keySaveState === 'success' &&
        state.syncState === 'success'
    )
}
