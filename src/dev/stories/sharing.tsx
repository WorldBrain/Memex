import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import ShareListModalContent from 'src/overview/sharing/components/ShareListModalContent'
import ShareNonPioneerInfo from 'src/overview/sharing/components/ShareNonPioneerInfo'

const stories = storiesOf('Sharing', module)

stories.add('Modal content - private', () => (
    <ShareListModalContent
        onClose={() => {}}
        listName={'Reading List'}
        listCreationState="pristine"
        onGenerateLinkClick={() => {}}
    />
))

stories.add('Modal content - public', () => (
    <ShareListModalContent
        onClose={() => {}}
        listName={'Reading List'}
        listCreationState="pristine"
        shareUrl={'https://memex.social/collections/jdfjf81d'}
        onGenerateLinkClick={() => {}}
    />
))

stories.add('Modal content - public & uploading', () => (
    <ShareListModalContent
        onClose={() => {}}
        listName={'Reading List'}
        listCreationState="running"
        shareUrl={'https://memex.social/collections/jdfjf81d'}
        onGenerateLinkClick={() => {}}
    />
))

stories.add('Modal content - not a pioneer', () => (
    <ShareNonPioneerInfo onClickUpgrade={() => {}} />
))

stories.addDecorator(withKnobs)
