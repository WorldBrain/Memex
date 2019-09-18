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
    static TOTAL_STEPS = 4
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
        const grabVal = (key: string, defVal: any) => ({
            enabled: storedVals[key] != null ? storedVals[key] : defVal,
        })

        this.processEvent(
            'setAnnotationsEnabled',
            grabVal(STORAGE_KEYS.LINKS, defs.areAnnotationsEnabled),
        )
        this.processEvent(
            'setBookmarksEnabled',
            grabVal(STORAGE_KEYS.BOOKMARKS, defs.areBookmarksEnabled),
        )
        this.processEvent(
            'setVisitsEnabled',
            grabVal(STORAGE_KEYS.VISITS, defs.areVisitsEnabled),
        )
        this.processEvent(
            'setScreenshotsEnabled',
            grabVal(STORAGE_KEYS.SCREENSHOTS, defs.areScreenshotsEnabled),
        )
        this.processEvent(
            'setStubsEnabled',
            grabVal(STORAGE_KEYS.STUBS, defs.areStubsEnabled),
        )
        this.processEvent('setVisitDelay', {
            delay: grabVal(STORAGE_KEYS.VISIT_DELAY, defs.visitDelay).enabled,
        })
        this.processEvent(
            'setTooltipEnabled',
            grabVal(TOOLTIP_STORAGE_NAME, defs.isTooltipEnabled),
        )
        this.processEvent(
            'setSidebarEnabled',
            grabVal(SIDEBAR_STORAGE_NAME, defs.isSidebarEnabled),
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

    private renderPlaceholderImage = () => <img width="100%" height="170px" />

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
                        subtitleText="Find any website or PDF again without upfront organisation."
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        renderButton={() => (
                            <NextStepButton onClick={this.handleNextStepClick}>
                                Get started
                            </NextStepButton>
                        )}
                    >
                        <p className={styles.textLarge}>
                            Learn how everything works and make Memex tailormade
                            for you.
                        </p>
                        <div className={styles.privacyImage} />
                    </OnboardingStep>
                )
            case 1:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Full-Text Search your Web History"
                        subtitleText="Find any website or PDF again without upfront organisation."
                        renderButton={() => (
                            <NextStepButton onClick={this.handleNextStepClick}>
                                Next
                            </NextStepButton>
                        )}
                        renderImage={() => {
                            if (!this.state.showSearchSettings) {
                                return this.renderPlaceholderImage()
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
                        titleText="Web Annotations"
                        subtitleText="Add highlight and make notes on websites and (soon) PDFs too."
                        renderButton={() => (
                            <NextStepButton onClick={this.handleNextStepClick}>
                                Next
                            </NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SettingsCheckbox
                            id="onboarding-tooltip-toggle"
                            isChecked={this.state.isTooltipEnabled}
                            handleChange={this.handleTooltipToggle}
                        >
                            Show Highlighter (or use Keyboard Shortcuts instead)
                        </SettingsCheckbox>
                    </OnboardingStep>
                )
            case 3:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Tag, favorite or sort content into collections"
                        subtitleText="Move your mouse to the right side of the screen to open the sidebar"
                        renderButton={() => (
                            <NextStepButton onClick={this.handleNextStepClick}>
                                Next
                            </NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SettingsCheckbox
                            id="onboarding-sidebar-toggle"
                            isChecked={this.state.isSidebarEnabled}
                            handleChange={this.handleSidebarToggle}
                        >
                            Show sidebar (or use keyboard shortcuts)
                        </SettingsCheckbox>
                    </OnboardingStep>
                )
            case 4:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Keyboard Shortcuts for Everything"
                        subtitleText="Use Memex without the Highlighter or Sidebar"
                        renderButton={() => (
                            <NextStepButton onClick={this.props.navToOverview}>
                                All done! Go to dashboard
                            </NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SettingsCheckbox
                            id="onboarding-keyboard-shortcuts-toggle"
                            isChecked={this.state.areShortcutsEnabled}
                            handleChange={this.handleShortcutsToggle}
                        >
                            Enable keyboard shortcuts
                        </SettingsCheckbox>
                        <a
                            className={searchSettingsStyles.settingsButton}
                            href={`${OPTIONS_URL}#/settings`}
                            target="_blank"
                        >
                            Change shortcut settings
                        </a>
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
