import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { checkServerStatus } from '../../backup-restore/ui/utils'
import { MemexLocalBackend } from '../background/backend'
import { PkmSyncInterface } from './types'
import { marked } from 'marked'
import TurndownService from 'turndown'

export class PKMSyncBackgroundModule {
    backend: MemexLocalBackend
    remoteFunctions: PkmSyncInterface

    backendNew: MemexLocalBackend

    constructor() {
        this.backendNew = new MemexLocalBackend({
            url: 'http://localhost:11922',
        })

        this.remoteFunctions = {
            pushPKMSyncUpdate: async (item) => {
                await this.processChanges(item)
            },
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            ...this.remoteFunctions,
        })
    }

    async processChanges(item) {
        console.log('item is', item)
        let page

        try {
            page = await this.backendNew.retrievePage(item.data.pageTitle)
        } catch (e) {
            console.log('error is', e)
        }

        let [pageHeader, annotationsSection] = [null, null]
        let pageIDbyTitle = item.data.pageTitle
        let fileContent = ''

        if (page) {
            ;[pageHeader, annotationsSection] = page.split('#### Annotations')
        } else {
            pageHeader = this.pageObjectDefault(
                item.data.pageTitle,
                item.data.fullPageUrl,
                (item.type === 'page' && item.data.spaces) || null,
                item.data.createdWhen,
            )
            annotationsSection = this.annotationObjectDefault(
                convertHTMLintoMarkdown(item.data.body),
                item.data.comment,
                (item === 'annotation' && item.data.HighlightSpaces) || null,
                item.data.createdWhen,
            )
        }

        if (item.type === 'page') {
            pageHeader = this.extractAndUpdatePageData(
                pageHeader ||
                    this.pageObjectDefault(
                        item.data.pageTitle,
                        item.data.fullPageUrl,
                        item.data.spaces || null,
                        item.data.createdWhen,
                    ),
                item.data.pageTitle || null,
                item.data.pageURL || null,
                item.data.pageSpaces || null,
                item.data.creationDate || null,
            )
        } else if (item.type === 'annotation') {
            const newAnnotationContent = this.annotationObjectDefault(
                convertHTMLintoMarkdown(item.data.body),
                item.data.comment,
                item.data.HighlightSpaces,
                item.data.createdWhen,
            )
            console.log('newAnnotationContent is', newAnnotationContent)
            const searchFor = `> ${convertHTMLintoMarkdown(item.data.body)}\n\n`
            annotationsSection = this.replaceOrAppendAnnotation(
                annotationsSection,
                searchFor,
                newAnnotationContent,
            )
        }

        fileContent =
            pageHeader + '#### Annotations\n\n' + (annotationsSection || '')

        console.log('fileContent is', fileContent)
        await this.backendNew.storeObject(pageIDbyTitle, fileContent)
    }

    replaceOrAppendAnnotation(
        annotationsSection,
        searchFor,
        newAnnotationContent,
    ) {
        const highlightIndex = annotationsSection.indexOf(searchFor)

        if (highlightIndex !== -1) {
            const annotationEndIndex = annotationsSection.indexOf(
                '---',
                highlightIndex,
            )
            return (
                annotationsSection.slice(0, highlightIndex) +
                newAnnotationContent +
                annotationsSection.slice(annotationEndIndex + 4)
            )
        } else {
            return annotationsSection + newAnnotationContent
        }
    }

    extractAndUpdateAnnotationData(
        annotation,
        HighlightText,
        HighlightNote,
        HighlightSpaces,
        creationDate,
    ) {
        // Extract data from the annotation
        const highlightTextMatch = annotation.match(/>\s*(.+)\n\n/)
        const highlightNoteMatch = annotation.match(/\*\*Note:\*\*\s*(.+)\n\n/)
        const creationDateMatch = annotation.match(
            /\*\*Created at:\*\*\s*(.+)\n/,
        )
        const spacesMatch = annotation.match(/\*\*Spaces: \*\*\s*(.+)\n\n/)

        const newHighlightText =
            HighlightText || (highlightTextMatch ? highlightTextMatch[1] : null)
        const newHighlightNote =
            HighlightNote || (highlightNoteMatch ? highlightNoteMatch[1] : null)
        const newCreationDate =
            creationDate || (creationDateMatch ? creationDateMatch[1] : null)
        const newSpaces =
            HighlightSpaces || (spacesMatch ? spacesMatch[1] : null)

        const updatedAnnotation = this.annotationObjectDefault(
            newHighlightText,
            newHighlightNote,
            newSpaces,
            newCreationDate,
        )

        return updatedAnnotation
    }

    extractAndUpdatePageData(
        pageHeader,
        pageTitle,
        pageURL,
        pageSpaces,
        creationDate,
    ) {
        // Extract data from pageHeader
        const titleMatch = pageHeader.match(/Title: (.+)/)
        const urlMatch = pageHeader.match(/Url: (.+)/)
        const creationDateMatch = pageHeader.match(/Created at: (.+)/)
        const spacesMatch = pageHeader.match(/Spaces: (.+)/)

        const newTitle = pageTitle || (titleMatch ? titleMatch[1] : null)
        const newURL = pageURL || (urlMatch ? urlMatch[1] : null)
        const newCreationDate =
            creationDate || (creationDateMatch ? creationDateMatch[1] : null)
        const newSpaces = pageSpaces || (spacesMatch ? spacesMatch[1] : null)

        const updatedPageHeader = this.pageObjectDefault(
            newTitle,
            newURL,
            newSpaces,
            newCreationDate,
        )

        return updatedPageHeader
    }

    pageObjectDefault(pageTitle, pageURL, pageSpaces, creationDate) {
        const titleLine = `Title: ${pageTitle}\n`
        const urlLine = `Url: ${pageURL}\n`
        const creationDateLine = `Created at: ${creationDate}\n`
        const spacesLine = pageSpaces ? `Spaces: ${pageSpaces}\n` : ''
        const pageSeparator = '---\n\n'

        const warning =
            '```\n❗️Do not edit this file or it will create duplicates or override your changes. For feedback, go to memex.garden/chatSupport.\n```\n'

        return (
            pageSeparator +
            titleLine +
            urlLine +
            creationDateLine +
            spacesLine +
            pageSeparator +
            warning
        )
    }

    annotationObjectDefault(
        HighlightText,
        HighlightNote,
        HighlightSpaces,
        creationDate,
    ) {
        const highlightTextLine = HighlightText ? `> ${HighlightText}\n\n` : ''
        const highlightNoteLine = HighlightNote
            ? `**Note:** ${HighlightNote}\n\n`
            : ''
        const creationDateLine = `**Created at:** ${creationDate}\n`
        const highlightSpacesLine = HighlightSpaces
            ? `**Spaces: **${HighlightSpaces}\n\n`
            : ''

        const highlightSeparator = '---\n\n'

        return (
            highlightTextLine +
            highlightNoteLine +
            highlightSpacesLine +
            creationDateLine +
            highlightSeparator
        )
    }
}

function convertHTMLintoMarkdown(html) {
    let turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        codeBlockStyle: 'fenced',
    })
    const markdown = turndownService.turndown(html)
    return markdown
}
