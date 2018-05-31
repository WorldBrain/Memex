import { configure } from '@storybook/react'

function loadStories() {
    require('../src/stories/index.js')
}

configure(loadStories, module)
