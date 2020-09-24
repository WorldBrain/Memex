import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import ShareListModalContent from 'src/overview/sharing/components/ShareListModalContent'
import ShareNonPioneerInfo from 'src/overview/sharing/components/ShareNonPioneerInfo'
import DisplayNameSetup from 'src/overview/sharing/components/DisplayNameSetup'

const stories = storiesOf('Sharing', module)

stories.add('Modal content - private', () => (
    <ShareListModalContent
        collectionName={'Reading List'}
        isShared={false}
        listCreationState="pristine"
        entriesUploadState="pristine"
        onClickToggle={() => {}}
        onClickLetUsKnow={() => {}}
        onClickViewRoadmap={() => {}}
        onClickSharingTutorial={() => {}}
    />
))

stories.add('Modal content - public', () => (
    <ShareListModalContent
        collectionName={'Reading List'}
        isShared={boolean('isShared', true)}
        listCreationState="pristine"
        entriesUploadState="pristine"
        shareUrl={'https://memex.social/collections/jdfjf81d'}
        onClickToggle={() => {}}
        onClickLetUsKnow={() => {}}
        onClickViewRoadmap={() => {}}
        onClickSharingTutorial={() => {}}
    />
))

stories.add('Modal content - public & uploading', () => (
    <ShareListModalContent
        collectionName={'Reading List'}
        isShared={boolean('isShared', true)}
        listCreationState="running"
        entriesUploadState="running"
        shareUrl={'https://memex.social/collections/jdfjf81d'}
        onClickToggle={() => {}}
        onClickLetUsKnow={() => {}}
        onClickViewRoadmap={() => {}}
        onClickSharingTutorial={() => {}}
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
