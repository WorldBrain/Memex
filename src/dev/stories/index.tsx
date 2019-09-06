import 'babel-polyfill'
import React from 'react'
import { storiesOf } from '@storybook/react'
import { Button, Welcome } from '@storybook/react/demo'

import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import ConfirmModal from 'src/common-ui/components/ConfirmModal'

storiesOf('Button demo', module).add('with text', () => (
    <Button>This is button</Button>
))

storiesOf('Welcome demo', module).add('no idea what this is', () => <Welcome />)

storiesOf('Memex loader', module).add('our main loading animation', () => (
    <LoadingIndicator />
))

storiesOf('Confirm modal', module).add('our main confirm modal', () => (
    <ConfirmModal
        isShown
        message="hey there"
        onClose={() => console.log('closed!')}
    />
))
