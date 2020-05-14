import { storiesOf } from '@storybook/react'
import OnboardingTooltip from 'src/overview/onboarding/components/onboarding-tooltip'
import { HelpCircle } from '@styled-icons/feather'
import React from 'react'
import ResultsMessageDismissible from 'src/overview/results/components/results-message-dismissible'

storiesOf('Onboarding phase 2: Tutorials', module)
    .add('Start', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip
                title="Learn about the tool"
                subtitle="Learn how to use Memex with 5 quick tips and tricks"
            >
                You can always view these tips in the future via the help button
                the the footer <HelpCircle size={24} />
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
    .add('Step 1: Search bar', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip
                title="Search your history"
                imgSrc="/img/onboarding-tutorials/search-bar.svg"
            >
                Use this shortcut 'M' and then hit spacebar in the address bar.
                Search with any word you remember about websites you’ve visited.
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
    .add('Step 2: Search tips', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip
                title="Search tips"
                imgSrc="/img/onboarding-tutorials/search-tips.svg"
            >
                You can search for time frames or tags using the browser address
                bar OR the Memex dashboard.
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
    .add('Step 3: Resarch', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip
                title="Doing a whole lot of research?"
                imgSrc="/img/onboarding-tutorials/search-tips.svg"
            >
                It's easy to add every tab you have open into a{' '}
                <i>collection</i> or <i>tag</i> all of them at the same time.
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
    .add('Step 4: Annotations', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip
                title="Add annotations or share highlights"
                imgSrc="/img/onboarding-tutorials/highlights.svg"
                CTAText="Try it now, lets visit Wikepedia"
                onCTAClick={() => undefined}
            >
                With the annotation bar enabled, you can select text on a page
                and easily add notes.
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
    .add('Step 5: Backups', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip title="Backups">
                With the Memex Backup App you can seamlessly backup, restore and
                (soon) sync your data between devices. You can use any of your
                favourite cloud providers for that, as long as they have a
                Dropbox-like folder on your file system.
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
    .add('Step 6: Import', () => (
        <ResultsMessageDismissible onDismiss={() => undefined}>
            <OnboardingTooltip
                title="Import from other sources"
                CTAText="Import"
                onCTAClick={() => undefined}
                imgSrc="/img/onboarding-tutorials/import.svg"
            >
                Import your existing bookmarks & web history from Pocket, Diigo,
                Raindrop.io and many more.
            </OnboardingTooltip>
        </ResultsMessageDismissible>
    ))
