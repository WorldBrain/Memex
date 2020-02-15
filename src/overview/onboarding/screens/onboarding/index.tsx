import React from 'react'
import { browser, Storage } from 'webextension-polyfill-ts'

import { StatefulUIElement } from 'src/overview/types'
import Logic, { State, Event } from './logic'
import OnboardingBox from '../../components/onboarding-box'
import OnboardingStep from '../../components/onboarding-step'
import NextStepButton from '../../components/next-step-button'
import SettingsCheckbox from '../../components/settings-checkbox'
import SearchSettings from '../../components/search-settings'
import { STORAGE_KEYS } from 'src/options/settings/constants'
import { SIDEBAR_STORAGE_NAME } from 'src/sidebar-overlay/constants'
import {
    TOOLTIP_STORAGE_NAME,
    KEYBOARDSHORTCUTS_STORAGE_NAME,
    KEYBOARDSHORTCUTS_DEFAULT_STATE,
} from 'src/content-tooltip/constants'
import { OPTIONS_URL } from 'src/constants'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { OnboardingAction } from 'src/common-ui/components/design-library/actions/OnboardingAction'

const styles = require('../../components/onboarding-box.css')
const searchSettingsStyles = require('../../components/search-settings.css')

export interface Props {
    storage: Storage.LocalStorageArea
    navToOverview: () => void
}

export default class OnboardingScreen extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static TOTAL_STEPS = 6
    static defaultProps: Partial<Props> = {
        storage: browser.storage.local,
    }

    constructor(props: Props) {
        super(props, new Logic())
    }

    componentDidMount() {
        this.hydrateStateFromStorage()
    }

    private async hydrateStateFromStorage() {
        const storedVals = await this.props.storage.get([
            ...Object.values(STORAGE_KEYS),
            SIDEBAR_STORAGE_NAME,
            TOOLTIP_STORAGE_NAME,
            KEYBOARDSHORTCUTS_STORAGE_NAME,
        ])

        // Set default vaslues if nothing present in storage
        const defs = this.logic.getInitialState()
        const grabVal = async (key: string, defVal: any) => {
            let enabled: boolean

            if (storedVals[key] == null) {
                enabled = defVal
                await this.props.storage.set({ [key]: enabled })
            } else {
                enabled = storedVals[key]
            }

            return { enabled }
        }

        this.processEvent(
            'setAnnotationsEnabled',
            await grabVal(STORAGE_KEYS.LINKS, defs.areAnnotationsEnabled),
        )
        this.processEvent(
            'setBookmarksEnabled',
            await grabVal(STORAGE_KEYS.BOOKMARKS, defs.areBookmarksEnabled),
        )
        this.processEvent(
            'setVisitsEnabled',
            await grabVal(STORAGE_KEYS.VISITS, defs.areVisitsEnabled),
        )
        this.processEvent(
            'setScreenshotsEnabled',
            await grabVal(STORAGE_KEYS.SCREENSHOTS, defs.areScreenshotsEnabled),
        )
        this.processEvent(
            'setStubsEnabled',
            await grabVal(STORAGE_KEYS.STUBS, defs.areStubsEnabled),
        )
        this.processEvent('setVisitDelay', {
            delay: (await grabVal(STORAGE_KEYS.VISIT_DELAY, defs.visitDelay))
                .enabled as any,
        })
        this.processEvent(
            'setTooltipEnabled',
            await grabVal(TOOLTIP_STORAGE_NAME, defs.isTooltipEnabled),
        )
        this.processEvent(
            'setSidebarEnabled',
            await grabVal(SIDEBAR_STORAGE_NAME, defs.isSidebarEnabled),
        )

        // Keyboard shortcut state is nested
        let shortcutsEnabled = storedVals[KEYBOARDSHORTCUTS_STORAGE_NAME]
        shortcutsEnabled =
            shortcutsEnabled != null
                ? shortcutsEnabled.shortcutsEnabled
                : defs.areShortcutsEnabled

        this.processEvent('setShortcutsEnabled', { enabled: shortcutsEnabled })
    }

    private areAllSettingsChecked() {
        return (
            this.state.areVisitsEnabled &&
            this.state.areBookmarksEnabled &&
            this.state.areAnnotationsEnabled
        )
    }

    private searchImage = () => (
        <img src={'/img/searchIntro.svg'} className={styles.searchGif} />
    )
    private annotationImage = () => (
        <img
            src={'/img/annotationIllustration.svg'}
            className={styles.annotationGif}
        />
    )
    private keyboardImage = () => (
        <img src={'/img/shortcutsIllustration.svg'} className={styles.keyboardGif} />
    )
    private sidebarImage = () => (
        <img src={'/img/sidebarIllustration.svg'} className={styles.sidebarGif} />
    )
    private mobileImg = () => (
        <img src={'/img/mobileIllustration.svg'} className={styles.mobileImg} />
    )

    private privacyImg = () => (
        <img src={'/img/privacyIllustration.png'} className={styles.privacyImg} />
    )

    private handleTooltipToggle = () => {
        const enabled = !this.state.isTooltipEnabled
        this.processEvent('setTooltipEnabled', { enabled })
        return this.props.storage.set({ [TOOLTIP_STORAGE_NAME]: enabled })
    }

    private handleSidebarToggle = () => {
        const enabled = !this.state.isSidebarEnabled
        this.processEvent('setSidebarEnabled', { enabled })
        return this.props.storage.set({ [SIDEBAR_STORAGE_NAME]: enabled })
    }

    private handleShortcutsToggle = () => {
        const enabled = !this.state.areShortcutsEnabled
        this.processEvent('setShortcutsEnabled', { enabled })

        return this.props.storage.set({
            [KEYBOARDSHORTCUTS_STORAGE_NAME]: {
                ...KEYBOARDSHORTCUTS_DEFAULT_STATE,
                shortcutsEnabled: enabled,
            },
        })
    }

    private handleNextStepClick = () => {
        this.processEvent('setStep', { step: this.state.currentStep + 1 })
    }

    private handleStepClick = (step: number) => () => {
        this.processEvent('setStep', { step })
    }

    private handleShowSearchSettingsToggle = () => {
        const shown = !this.state.showSearchSettings
        this.processEvent('setSearchSettingsShown', { shown })
    }

    private handleAllSettingsToggle = () => {
        const enabled = !this.areAllSettingsChecked()
        this.processEvent('setAnnotationsEnabled', { enabled })
        this.processEvent('setVisitsEnabled', { enabled })
        this.processEvent('setBookmarksEnabled', { enabled })

        return this.props.storage.set({
            [STORAGE_KEYS.LINKS]: enabled,
            [STORAGE_KEYS.VISITS]: enabled,
            [STORAGE_KEYS.BOOKMARKS]: enabled,
        })
    }

    private handleVisitDelayChange = (
        e: React.SyntheticEvent<HTMLInputElement>,
    ) => {
        const el = e.target as HTMLInputElement
        const delay = +el.value

        this.processEvent('setVisitDelay', { delay })
        this.props.storage.set({ [STORAGE_KEYS.VISIT_DELAY]: delay })
    }

    private renderSearchSettings() {
        return (
            <SearchSettings
                visitDelay={this.state.visitDelay}
                stubs={this.state.areStubsEnabled}
                visits={this.state.areVisitsEnabled}
                bookmarks={this.state.areBookmarksEnabled}
                annotations={this.state.areAnnotationsEnabled}
                screenshots={this.state.areScreenshotsEnabled}
                toggleAll={this.handleAllSettingsToggle}
                setVisitDelayChange={this.handleVisitDelayChange}
                showSearchSettings={this.state.showSearchSettings}
                toggleShowSearchSettings={this.handleShowSearchSettingsToggle}
                areAllSettingsChecked={this.areAllSettingsChecked()}
                toggleAnnotations={() => {
                    const enabled = !this.state.areAnnotationsEnabled
                    this.processEvent('setAnnotationsEnabled', { enabled })
                    return this.props.storage.set({
                        [STORAGE_KEYS.LINKS]: enabled,
                    })
                }}
                toggleStubs={() => {
                    const enabled = !this.state.areStubsEnabled
                    this.processEvent('setStubsEnabled', { enabled })
                    return this.props.storage.set({
                        [STORAGE_KEYS.STUBS]: enabled,
                    })
                }}
                toggleVisits={() => {
                    const enabled = !this.state.areVisitsEnabled
                    this.processEvent('setVisitsEnabled', { enabled })
                    return this.props.storage.set({
                        [STORAGE_KEYS.VISITS]: enabled,
                    })
                }}
                toggleBookmarks={() => {
                    const enabled = !this.state.areBookmarksEnabled
                    this.processEvent('setBookmarksEnabled', { enabled })
                    return this.props.storage.set({
                        [STORAGE_KEYS.BOOKMARKS]: enabled,
                    })
                }}
                toggleScreenshots={() => {
                    const enabled = !this.state.areScreenshotsEnabled
                    this.processEvent('setScreenshotsEnabled', { enabled })
                    return this.props.storage.set({
                        [STORAGE_KEYS.SCREENSHOTS]: enabled,
                    })
                }}
            />
        )
    }

    private renderCurrentStep() {
        switch (this.state.currentStep) {
            default:
            case 0:
                return (
                    <OnboardingStep
                        isInitStep
                        titleText="Setup your Memex in less than 1 minute"
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.handleNextStepClick}
                                label={'Get Started'}
                            />
                        )}
                    >
                        <img
                            src="img/privacy.svg"
                            alt="A person floating above the earth on a laptop"
                            className={styles.floatingImage}
                        />
                    </OnboardingStep>
                )
            case 1:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Search everything you’ve seen online"
                        subtitleText="Full-Text search every website & PDF you’ve visited."
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.handleNextStepClick}
                                label={'Next'}
                            />
                        )}
                        renderImage={() => {
                            if (!this.state.showSearchSettings) {
                                return this.searchImage()
                            }
                        }}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        {this.renderSearchSettings()}
                    </OnboardingStep>
                )
            case 2:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Make Highlights & Notes"
                        subtitleText="Simply select some text on the web to get started."
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.handleNextStepClick}
                                label={'Next'}
                            />
                        )}
                        renderImage={this.annotationImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SettingsCheckbox
                            id="onboarding-tooltip-toggle"
                            isChecked={this.state.isTooltipEnabled}
                            handleChange={this.handleTooltipToggle}
                        >
                            Show Highlighter when selecting text
                        </SettingsCheckbox>
                    </OnboardingStep>
                )
            case 3:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Tags, Lists & Favorites"
                        subtitleText="Quickly organise everything via a web-page sidebar"
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.handleNextStepClick}
                                label={'Next'}
                            />
                        )}
                        renderImage={this.sidebarImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SettingsCheckbox
                            id="onboarding-sidebar-toggle"
                            isChecked={this.state.isSidebarEnabled}
                            handleChange={this.handleSidebarToggle}
                        >
                            Show Sidebar when moving cursor to the right of your
                            screen
                        </SettingsCheckbox>
                    </OnboardingStep>
                )
            case 4:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Keyboard Shortcuts for Everything"
                        subtitleText="Enough said."
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.handleNextStepClick}
                                label={'Next'}
                            />
                        )}
                        renderImage={this.keyboardImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SecondaryAction
                            onClick={() =>
                                window.open(`${OPTIONS_URL}#/settings`)
                            }
                            label={'Change Shortcuts'}
                        />
                    </OnboardingStep>
                )
            case 5:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Save, View & Organise on the Go"
                        subtitleText="Install Memex Go for iOS and Android"
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.handleNextStepClick}
                                label={'Next'}
                            />
                        )}
                        renderImage={this.mobileImg}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SecondaryAction
                            onClick={() => window.open(`${OPTIONS_URL}#/sync`)}
                            label={'Setup Sync'}
                        />
                    </OnboardingStep>
                )
            case 6:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Your Data & Attention is Yours"
                        subtitleText="All data is stored offline-first and synced with End2End encryption."
                        subtitleText2="Memex is funded without Venture Capital investments"
                        renderButton={() => (
                            <OnboardingAction
                                onClick={this.props.navToOverview}
                                label={'All done! Go to dashboard'}
                            />
                        )}
                        renderImage={this.privacyImg}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SecondaryAction
                            onClick={() => window.open(`https://community.worldbrain.io/t/why-worldbrain-io-does-not-take-venture-capital/75`)}
                            label={'Learn More'}
                        />
                    </OnboardingStep>
                )
        }
    }

    render() {
        return (
            <OnboardingBox {...this.props}>
                {this.renderCurrentStep()}
            </OnboardingBox>
        )
    }
}
