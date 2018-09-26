import { configure } from '@storybook/react'

function loadStories() {
    require('../src/dev/stories/index.js')
}

configure(loadStories, module)
