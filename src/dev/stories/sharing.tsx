import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import ShareListModalContent from 'src/overview/sharing/components/ShareListModalContent'
import ShareNonPioneerInfo from 'src/overview/sharing/components/ShareNonPioneerInfo'
import DisplayNameSetup from 'src/overview/sharing/components/DisplayNameSetup'

const stories = storiesOf('Sharing', module)

stories.add('Modal content - private', () => (
    <ShareListModalContent
        onClose={() => {}}
        listName={'Reading List'}
        isShared={false}
        listCreationState="pristine"
        onGenerateLinkClick={() => {}}
    />
))

stories.add('Modal content - public', () => (
    <ShareListModalContent
        onClose={() => {}}
        listName={'Reading List'}
        isShared={boolean('isShared', true)}
        listCreationState="pristine"
        shareUrl={'https://memex.social/collections/jdfjf81d'}
        onGenerateLinkClick={() => {}}
    />
))

stories.add('Modal content - public & uploading', () => (
    <ShareListModalContent
        onClose={() => {}}
        listName={'Reading List'}
        isShared={boolean('isShared', true)}
        listCreationState="running"
        shareUrl={'https://memex.social/collections/jdfjf81d'}
        onGenerateLinkClick={() => {}}
    />
))

stories.add('Modal content - not a pioneer', () => (
    <ShareNonPioneerInfo onClickUpgrade={() => {}} />
))

stories.add('Modal content - display name setup', () => (
    <DisplayNameSetup
        name={'John Smith'}
        onChange={(newName) => {}}
        onClickNext={() => {}}
    />
))

stories.addDecorator(withKnobs)
