import { storiesOf } from '@storybook/react'
import * as knobs from '@storybook/addon-knobs'
import React from 'react'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import SidebarContainer from 'src/in-page-ui/sidebar/react/containers/sidebar'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { ResultsByUrl } from 'src/overview/types'

class WithDependencies<Dependencies> extends React.Component<
    {
        setup: () => Promise<Dependencies>
        children: (dependencies: Dependencies) => React.ReactNode
    },
    { dependencies?: Dependencies }
> {
    state: { dependencies?: Dependencies } = {}

    async componentDidMount() {
        this.setState({ dependencies: await this.props.setup() })
    }

    render() {
        if (!this.state.dependencies) {
            return null
        }
        return this.props.children(this.state.dependencies)
    }
}

const stories = storiesOf('Sidebar', module)
stories.addDecorator(knobs.withKnobs)

stories.add('Dynamic - In page', () => (
    <WithDependencies
        setup={async () => {
            const testSetup = await setupBackgroundIntegrationTest()
            await testSetup.backgroundModules.directLinking.annotationStorage.createAnnotation(
                {
                    pageTitle: 'Foo title',
                    pageUrl: 'foo.com',
                    url: 'foo.com#4r234523453',
                    body: 'Annotation body',
                    comment: 'Annotation comment',
                    createdWhen: new Date(),
                },
            )
            await testSetup.backgroundModules.pages.addPage({
                bookmark: Date.now(),
                visits: [Date.now() - 1000 * 60 * 5],
                pageDoc: {
                    url: 'http://foo.com',
                    content: {
                        title: 'Foo title',
                        fullText: 'Foo page text',
                    },
                },
                rejectNoContent: true,
            })

            const annotationManager = new AnnotationsManager()
            annotationManager._getAllAnnotationsByUrlRPC =
                testSetup.backgroundModules.directLinking.getAllAnnotationsByUrl

            const highlighter = {
                removeTempHighlights: async () => {},
                removeAnnotationHighlights: async () => {},
            }

            return {
                testSetup,
                annotationManager,
                inPageUIController: null,
                highlighter,
            }
        }}
    >
        {({ testSetup, annotationManager, highlighter }) => (
            <SidebarContainer
                env={'inpage'}
                currentTab={{ id: 654, url: 'https://www.foo.com' }}
                annotationManager={annotationManager}
                sidebarEvents={
                    {
                        on: () => {},
                        removeListener: () => {},
                    } as any
                }
                loadTagSuggestions={async () => [
                    // (await getLocalStorage(TAG_SUGGESTIONS_KEY, [])).reverse()

                    'first suggestion',
                    'second suggestion',
                ]}
                loadAnnotations={async pageUrl => {
                    return testSetup.backgroundModules.directLinking.getAllAnnotationsByUrl(
                        { tab: null },
                        { url: pageUrl },
                    )
                }}
                searchPages={async query => {
                    const result = await testSetup.backgroundModules.search.searchPages(
                        {
                            query: query.length ? query : undefined,
                            contentTypes: {
                                pages: true,
                                notes: true,
                                highlights: true,
                            },
                        },
                    )
                    return result.docs
                }}
                searchAnnotations={async query => {
                    const result = await testSetup.backgroundModules.search.searchAnnotations(
                        {
                            query: query.length ? query : undefined,
                        },
                    )

                    const resultsByUrl: ResultsByUrl = new Map()
                    result.docs.forEach((doc, index) => {
                        resultsByUrl.set(doc.pageId, {
                            ...doc,
                            index,
                        })
                    })

                    return {
                        results: result.docs,
                        resultsByUrl,
                        annotsByDay: result['annotsByDay'],
                    }
                }}
                deleteAnnotation={async () => {}}
                highlighter={highlighter}
            />
        )}
    </WithDependencies>
))
