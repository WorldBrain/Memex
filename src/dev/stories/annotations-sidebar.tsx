import { storiesOf } from '@storybook/react'
import React from 'react'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { action } from '@storybook/addon-actions'
import { WithDependencies } from 'src/dev/utils'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from 'src/sidebar/annotations-sidebar/components/AnnotationsSidebar'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'

async function createDependencies() {
    const background = await setupBackgroundIntegrationTest()

    const tagPickerDependencies: GenericPickerDependenciesMinusSave = {
        loadDefaultSuggestions: async () => [],
    }

    const sidebarDependencies: AnnotationsSidebarProps = {
        annotationCreateProps: {
            anchor: null,
            onCancel: action('onCancel'),
            onSave: action('onSave'),
            tagPickerDependencies,
        },
        isAnnotationCreateShown: true,
        onSearch: action('onSearch'),
        annotations: [],
    }

    return { sidebarDependencies }
}

storiesOf('AnnotationSidebar', module).add('Annotations Sidebar', () => (
    <div>
        <WithDependencies setup={createDependencies}>
            {({ sidebarDependencies }) => (
                <AnnotationsSidebar {...sidebarDependencies} />
            )}
        </WithDependencies>
    </div>
))
