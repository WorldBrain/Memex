import React from 'react'

import { StatefulUIElement } from 'src/overview/types'
import Logic, { State, Event } from './logic'
import OnboardingBox from '../../components/onboarding-box'
import OnboardingStep from '../../components/onboarding-step'
import NextStepButton from '../../components/next-step-button'
import SettingsCheckbox from '../../components/settings-checkbox'
import SearchSettings from '../../components/search-settings'

const styles = require('../../components/onboarding-box.css')

export interface Props {}

export default class OnboardingScreen extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static TOTAL_STEPS = 4

    constructor(props: Props) {
        super(props, new Logic())
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
        this.processEvent('setTooltipEnabled', {
            enabled: !this.state.isTooltipEnabled,
        })
    }

    private handleSidebarToggle = () => {
        this.processEvent('setSidebarEnabled', {
            enabled: !this.state.isSidebarEnabled,
        })
    }

    private handleNextStepClick = () => {
        this.processEvent('setStep', { step: this.state.currentStep + 1 })
    }

    private handleStepClick = (step: number) => () => {
        this.processEvent('setStep', { step })
    }

    private handleShowSearchSettingsToggle = () => {
        this.processEvent('setSearchSettingsShown', {
            shown: !this.state.showSearchSettings,
        })
    }

    private handleAllSettingsToggle = () => {
        const enabled = !this.areAllSettingsChecked()
        this.processEvent('setAnnotationsEnabled', { enabled })
        this.processEvent('setVisitsEnabled', { enabled })
        this.processEvent('setBookmarksEnabled', { enabled })
        this.processEvent('setCollectionsEnabled', { enabled })
    }

    private renderSearchSettings() {
        return (
            <SearchSettings
                stubs={this.state.areStubsEnabled}
                visits={this.state.areVisitsEnabled}
                bookmarks={this.state.areBookmarksEnabled}
                annotations={this.state.areAnnotationsEnabled}
                screenshots={this.state.areScreenshotsEnabled}
                toggleAll={this.handleAllSettingsToggle}
                showSearchSettings={this.state.showSearchSettings}
                toggleShowSearchSettings={this.handleShowSearchSettingsToggle}
                areAllSettingsChecked={this.areAllSettingsChecked()}
                toggleAnnotations={() =>
                    this.processEvent('setAnnotationsEnabled', {
                        enabled: !this.state.areAnnotationsEnabled,
                    })
                }
                toggleStubs={() =>
                    this.processEvent('setStubsEnabled', {
                        enabled: !this.state.areStubsEnabled,
                    })
                }
                toggleVisits={() =>
                    this.processEvent('setVisitsEnabled', {
                        enabled: !this.state.areVisitsEnabled,
                    })
                }
                toggleBookmarks={() =>
                    this.processEvent('setBookmarksEnabled', {
                        enabled: !this.state.areBookmarksEnabled,
                    })
                }
                toggleScreenshots={() =>
                    this.processEvent('setScreenshotsEnabled', {
                        enabled: !this.state.areScreenshotsEnabled,
                    })
                }
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
                        titleText="Let us take you through a few key settings to make sure you get the most out of Memex"
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        renderButton={() => (
                            <NextStepButton onClick={this.handleNextStepClick}>
                                Get started
                            </NextStepButton>
                        )}
                    >
                        <p className={styles.textLarge}>
                            Have control over how much of your history is
                            captured
                        </p>
                        <p className={styles.textLarge}>
                            Have control over how Memex is displayed
                        </p>
                    </OnboardingStep>
                )
            case 1:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Can’t remember where you found something but know the text you are after?"
                        renderButton={() => (
                            <NextStepButton
                                onClick={this.handleNextStepClick}
                                color="mint"
                            >
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
                        titleText="Use the tooltip when browsing the web to allow for quick annotations and sharing"
                        renderButton={() => (
                            <NextStepButton
                                onClick={this.handleNextStepClick}
                                color="blue"
                            >
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
                            Show tool tip when highlighting content online
                        </SettingsCheckbox>
                    </OnboardingStep>
                )
            case 3:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Have quick access to key features by enabling the sidebar"
                        renderButton={() => (
                            <NextStepButton
                                onClick={this.handleNextStepClick}
                                color="purple"
                            >
                                Next
                            </NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <SettingsCheckbox
                            id="onboarding-ribbon-toggle"
                            isChecked={this.state.isSidebarEnabled}
                            handleChange={this.handleSidebarToggle}
                        >
                            Enable quick edit in sidebar
                        </SettingsCheckbox>
                    </OnboardingStep>
                )
            case 4:
                return (
                    <OnboardingStep
                        goToStep={this.handleStepClick}
                        titleText="Powerup your indexing with custom keyboard shortcuts"
                        renderButton={() => (
                            <NextStepButton color="purple">
                                Close
                            </NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={OnboardingScreen.TOTAL_STEPS}
                        currentStep={this.state.currentStep - 1}
                    >
                        <p>Enable keyboard shortcuts</p>
                    </OnboardingStep>
                )
        }
    }

    render() {
        return <OnboardingBox>{this.renderCurrentStep()}</OnboardingBox>
    }
}
