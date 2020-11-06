import fromPairs from 'lodash/fromPairs'
import {
    makeSingleDeviceUILogicTestFactory,
    SingleDeviceUILogicTestContext,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { ReadwiseSettingsState, ReadwiseSettingsDependencies } from './types'
import ReadwiseSettingsLogic, { INITIAL_STATE } from './logic'
import * as selectors from './selectors'

function allSelectors(state: ReadwiseSettingsState) {
    return fromPairs(
        Object.entries(selectors)
            .map(([key, value]) => {
                return typeof value === 'function' ? [key, value(state)] : null
            })
            .filter((pair) => !!pair),
    )
}

async function setupTest(
    options: {
        device: UILogicTestDevice
    } & Partial<ReadwiseSettingsDependencies>,
) {
    const logic = new ReadwiseSettingsLogic({
        readwise: options.device.backgroundModules.readwise,
        checkFeatureAuthorized: async () => true,
        showSubscriptionModal: () => {},
        ...options,
    })
    const settings = options.device.createElement(logic)
    return { settings }
}

describe('Readwise integration settings UI', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should initialize the UI without a saved key', async ({ device }) => {
        const { settings } = await setupTest({ device })
        await settings.init()
        expect(settings.state).toEqual({
            ...INITIAL_STATE,
            loadState: 'success',
            isFeatureAuthorized: true,
            apiKeyEditable: true,
        })
        expect(allSelectors(settings.state)).toEqual({
            apiKeyDisabled: false,
            formEditable: true,
            keySaveErrorMessage: '',
            showForm: true,
            showKeyRemoveButton: false,
            showKeySaveButton: false,
            showKeySaveError: false,
            showKeySaving: false,
            showKeySuccessMessage: false,
            showLoadingError: false,
            showSyncError: false,
            showSyncRunning: false,
            showSyncScreen: false,
            showSyncSuccessMessage: false,
            showUnauthorized: false,
        })
    })

    it('should initialize the UI without being authorized to use the feature', async ({
        device,
    }) => {
        const { settings } = await setupTest({
            device,
            checkFeatureAuthorized: async () => false,
        })
        await settings.init()
        expect(settings.state).toEqual({
            ...INITIAL_STATE,
            loadState: 'success',
            isFeatureAuthorized: false,
            apiKeyEditable: true,
        })
        expect(allSelectors(settings.state)).toEqual({
            apiKeyDisabled: true,
            formEditable: false,
            keySaveErrorMessage: '',
            showForm: false,
            showKeyRemoveButton: false,
            showKeySaveButton: false,
            showKeySaveError: false,
            showKeySaving: false,
            showKeySuccessMessage: false,
            showLoadingError: false,
            showSyncError: false,
            showSyncRunning: false,
            showSyncScreen: false,
            showSyncSuccessMessage: false,
            showUnauthorized: true,
        })
    })

    it('should reset the UI when removing the API key', async ({ device }) => {
        await device.backgroundModules.readwise.setAPIKey({
            validatedKey: 'valid key ',
        })
        const { settings } = await setupTest({ device })
        await settings.init()
        await settings.processEvent('removeAPIKey', null)
        expect(settings.state).toEqual({
            ...INITIAL_STATE,
            loadState: 'success',
            isFeatureAuthorized: true,
            apiKey: null,
            apiKeyEditable: true,
        })
    })
})
