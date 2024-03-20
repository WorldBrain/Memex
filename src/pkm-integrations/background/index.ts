import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { MemexLocalBackend } from '../background/backend'
import { browser } from 'webextension-polyfill-ts'
import moment from 'moment'
import type { PkmSyncInterface } from './types'
import { LocalFolder } from 'src/sidebar/annotations-sidebar/containers/types'
import { LOCAL_SERVER_ROOT } from 'src/backup-restore/ui/backup-pane/constants'
import { htmlToMarkdown } from 'src/background-script/html-to-markdown'
import resolveImgSrc from '@worldbrain/memex-common/lib/annotations/replace-img-src-with-cloud-address.service-worker'

export class PKMSyncBackgroundModule {
    backend: MemexLocalBackend
    remoteFunctions: PkmSyncInterface

    backendNew: MemexLocalBackend
    PKMSYNCremovewarning = true
    serverToTalkTo = LOCAL_SERVER_ROOT
    constructor() {
        this.backendNew = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })
        this.remoteFunctions = {
            addFeedSources: this.addFeedSources,
            checkConnectionStatus: this.checkConnectionStatus,
            loadFeedSources: this.loadFeedSources,
            checkFeedSource: this.checkFeedSource,
            removeFeedSource: this.removeFeedSource,
            openLocalFile: this.openLocalFile,
            addLocalFolder: this.addLocalFolder,
            getLocalFolders: this.getLocalFolders,
            removeLocalFolder: this.removeLocalFolder,
            getSystemArchAndOS: this.getSystemArchAndOS,
        }
    }

    getSystemArchAndOS = async () => {
        let os
        let arch
        await browser.runtime.getPlatformInfo().then(function (info) {
            os = info.os
            arch = info.arch
        })

        if (arch === 'aarch64' || arch === 'arm' || arch === 'arm64') {
            arch = 'arm'
        }
        if (arch === 'x86-64') {
            arch = 'x64'
        }

        return {
            arch,
            os,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            ...this.remoteFunctions,
        })
    }

    checkConnectionStatus = async () => {
        return this.backendNew.isReadyToSync()
    }

    async pushRabbitHoleUpdate(entryData) {
        if (await this.backendNew.isConnected()) {
            const document = {
                createdWhen: entryData.createdWhen,
                creatorId: entryData.creatorId,
                pageTitle: entryData.pageTitle,
                fullUrl: entryData.fullUrl,
                contentType: entryData.contentType,
                fullHTML: entryData.fullHTML,
            }

            await this.backendNew.vectorIndexDocument(document)
        }
    }
    loadFeedSources = async () => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })
        return await backend.loadFeedSources()
    }
    addFeedSources = async (
        feedSources: {
            feedUrl: string
            feedTitle: string
            type?: 'substack'
            feedFavIcon?: string
        }[],
    ) => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })

        await backend.addFeedSources(feedSources)
    }
    openLocalFile = async (path: string) => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })

        await backend.openLocalFile(path)
    }
    removeFeedSource = async (feedUrl: string) => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })

        await backend.removeFeedSource(feedUrl)
    }
    removeLocalFolder = async (id: number) => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })

        await backend.removeLocalFolder(id)
    }
    addLocalFolder = async (): Promise<LocalFolder> => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })

        const folderAdded = await backend.addLocalFolder()
        return folderAdded
    }
    getLocalFolders = async (): Promise<LocalFolder[]> => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
        })

        const folders = await backend.getLocalFolders()
        return folders
    }
    checkFeedSource = async (
        feedUrl: string,
    ): Promise<{
        feedUrl: string
        feedTitle: string
        feedFavIcon?: string
    }> => {
        try {
            // Initialize source object with null values
            let source = {
                feedUrl: null,
                feedTitle: null,
                feedFavIcon: null,
            }
            // Fetch the feed URL
            const response = await fetch(feedUrl)
            const text = await response.text()
            // Get the content type of the response
            const contentType = response.headers.get('content-type')

            const isAtom = text.includes('<feed xml')
            const isRSS =
                contentType?.includes('rss') || contentType?.includes('xml')
            // Check if the content type is XML
            if (isAtom) {
                // Check if the feed is an atom feed
                // If it is, extract the feed title and URL
                const title = text.match(/<title>(.*?)<\/title>/)[1]
                source.feedTitle = title
                source.feedUrl = feedUrl
                // Return the source object
                return source
            } else if (isRSS) {
                // If it is, set the feed URL and title in the source object
                source.feedUrl = feedUrl
                const title = text.match(/<title>(.*?)<\/title>/)[1]
                source.feedTitle = title
                // Return the source object
                return source
            } else {
                // If it's not XML, try fetching the feed URL with '/feed' appended
                const url = new URL(feedUrl)
                feedUrl = `${url.protocol}//${url.hostname}/feed`
                source.feedUrl = feedUrl
                const response = await fetch(feedUrl)

                const contentType = response.headers.get('content-type')

                // Check if the new content type is XML
                if (
                    contentType &&
                    (contentType.includes('rss') || contentType.includes('xml'))
                ) {
                    // If it is, set the feed URL and title in the source object
                    const text = await response.text()
                    const title = text.match(/<title>(.*?)<\/title>/)[1]
                    source.feedTitle = title
                    // Return the source object
                    return source
                } else {
                    // If it's still not XML, throw an error
                    throw new Error('not-found')
                }
            }
        } catch (error) {
            console.error(`Error checking feed source: ${feedUrl}`, error)
        }
    }

    async pushPKMSyncUpdate(item, checkForFilteredSpaces) {
        if (await this.backendNew.isConnected()) {
            const bufferedItems = await this.getBufferedItems()
            bufferedItems.push(item)
            const PKMSYNCremovewarning = await browser.storage.local.get(
                'PKMSYNCremovewarning',
            )

            this.PKMSYNCremovewarning =
                PKMSYNCremovewarning.PKMSYNCremovewarning

            for (const item of bufferedItems) {
                await this.processChanges(item, checkForFilteredSpaces)
            }
        } else {
            await this.bufferPKMSyncItems(item)
        }
    }

    async applySyncFilters(pkmType, item, checkForFilteredSpaces) {
        const spaces = item.data.annotationSpaces || item.data.pageSpaces
        if (pkmType === 'obsidian') {
            const filterTagsObsidian = await browser.storage.local.get(
                'PKMSYNCfilterTagsObsidian',
            )
            if (
                spaces &&
                filterTagsObsidian.PKMSYNCfilterTagsObsidian?.includes(spaces)
            ) {
                return true
            }

            if (
                checkForFilteredSpaces &&
                filterTagsObsidian.PKMSYNCfilterTagsObsidian?.length > 0 &&
                !(await checkForFilteredSpaces(
                    item.type === 'annotation'
                        ? item.data.annotationId
                        : item.data.pageUrl,
                    filterTagsObsidian.PKMSYNCfilterTagsObsidian,
                ))
            ) {
                return false
            }
            if (
                checkForFilteredSpaces == null &&
                filterTagsObsidian.PKMSYNCfilterTagsObsidian?.length > 0
            ) {
                return false
            }
            return true
        }

        if (pkmType === 'logseq') {
            const filterTagsLogseq = await browser.storage.local.get(
                'PKMSYNCfilterTagsLogseq',
            )

            if (
                spaces &&
                filterTagsLogseq.PKMSYNCfilterTagsLogseq.includes(spaces)
            ) {
                return true
            }

            if (
                checkForFilteredSpaces &&
                filterTagsLogseq.PKMSYNCfilterTagsLogseq?.length > 0 &&
                !(await checkForFilteredSpaces(
                    item.type === 'annotation'
                        ? item.data.annotationId
                        : item.data.pageUrl,
                    filterTagsLogseq.PKMSYNCfilterTagsLogseq,
                ))
            ) {
                return false
            }

            if (
                checkForFilteredSpaces == null &&
                filterTagsLogseq.PKMSYNCfilterTagsObsidian?.length > 0
            ) {
                return false
            }
            return true
        }
    }

    async bufferPKMSyncItems(itemToBuffer) {
        // Get the current buffer from browser.storage.local
        const data = await browser.storage.local.get('PKMSYNCbufferedItems')
        const currentBuffer = data.PKMSYNCbufferedItems || []

        if (currentBuffer?.length > 2000) {
            await browser.storage.local.set({ PKMSYNCbufferMaxReached: true })
            return
        }

        // Append the new item to the buffer
        currentBuffer.push(itemToBuffer)

        // Save the updated buffer back to browser.storage.local
        await browser.storage.local.set({ PKMSYNCbufferedItems: currentBuffer })
    }

    async getBufferedItems() {
        // Check for buffered items in browser.storage.local
        const data = await browser.storage.local.get('PKMSYNCbufferedItems')
        const bufferedItems = data.PKMSYNCbufferedItems || []

        // After retrieving the buffered items, delete them from local storage
        await browser.storage.local.remove('PKMSYNCbufferedItems')

        return bufferedItems
    }

    private async getValidFolders() {
        const data = await browser.storage.local.get('PKMSYNCpkmFolders')
        const folders = data.PKMSYNCpkmFolders || {}

        const validFolders = {
            logSeq: !!folders.logSeqFolder,
            obsidian: !!folders.obsidianFolder,
        }

        return validFolders
    }

    async processChanges(item, checkForFilteredSpaces) {
        const validFolders = await this.getValidFolders()

        // Process for LogSeq if valid
        if (validFolders.logSeq) {
            if (
                !(await this.applySyncFilters(
                    'logseq',
                    item,
                    checkForFilteredSpaces,
                ))
            ) {
                return
            }
            // let syncOnlyAnnotatedPagesLogseq = await browser.storage.local.get(
            //     'PKMSYNCsyncOnlyAnnotatedPagesLogseq',
            // )

            const PKMSYNCtitleformatLogseq = await browser.storage.local.get(
                'PKMSYNCtitleformatLogseq',
            )
            const PKMSYNCdateformatLogseq = await browser.storage.local.get(
                'PKMSYNCdateformatLogseq',
            )
            const customTagsLogseq = await browser.storage.local.get(
                'PKMSYNCcustomTagsLogseq',
            )

            item.data.pageTitle = this.cleanFileName(
                item.data.pageTitle,
                false,
                true,
            )

            try {
                await this.createPageUpdate(
                    item,
                    'logseq',
                    PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq,
                    customTagsLogseq.PKMSYNCcustomTagsLogseq,
                    PKMSYNCtitleformatLogseq.PKMSYNCtitleformatLogseq,
                )
            } catch (e) {
                console.error('error', e)
            }
            // Logic to process changes for LogSeq
            // For example: await this.processForLogSeq(page);
        }

        // Process for Obsidian if valid
        if (validFolders.obsidian) {
            if (
                !(await this.applySyncFilters(
                    'obsidian',
                    item,
                    checkForFilteredSpaces,
                ))
            ) {
                return
            }
            // let syncOnlyAnnotatedPagesObsidian = await browser.storage.local.get(
            //     'PKMSYNCsyncOnlyAnnotatedPagesObsidian',
            // )
            const PKMSYNCtitleformatObsidian = await browser.storage.local.get(
                'PKMSYNCtitleformatObsidian',
            )
            const PKMSYNCdateformatObsidian = await browser.storage.local.get(
                'PKMSYNCdateformatObsidian',
            )
            const customTagsObsidian = await browser.storage.local.get(
                'PKMSYNCcustomTagsObsidian',
            )

            item.data.pageTitle = this.cleanFileName(
                item.data.pageTitle,
                false,
                true,
            )

            try {
                await this.createPageUpdate(
                    item,
                    'obsidian',
                    PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian,
                    customTagsObsidian.PKMSYNCcustomTagsObsidian,
                    PKMSYNCtitleformatObsidian.PKMSYNCtitleformatObsidian,
                )
            } catch (e) {
                this.bufferPKMSyncItems(item)
                console.error('error', e)
            }
        }
    }

    cleanFileName(fileNameInput, onlyParenthesisRemoval, onlyRemoveColon) {
        let fileName = fileNameInput

        // Remove any () and its encapsulated content from the string
        fileName = fileName?.replace(/\(.*?\)/g, '')

        if (onlyRemoveColon) {
            fileName = fileName?.replace(/:/g, ' ')
        } else {
            if (!onlyParenthesisRemoval) {
                // Remove any characters that are not allowed in filenames and replace them with hyphens
                const illegalCharacters = /[#%&{}\\<>?:/$!'"@+`|=]/g
                fileName = fileName?.replace(illegalCharacters, '-')
            }
        }
        fileName = fileName?.trim()

        return fileName
    }

    processPageTitleFormat(pageTitleFormat, pageTitle, pageCreatedWhen) {
        let finalTitle = pageTitleFormat

        finalTitle = finalTitle.replace('{{{PageTitle}}}', pageTitle)
        finalTitle = this.cleanFileName(finalTitle, false, false)

        const datePattern = /{{{Date: "(.*?)"}}}/
        const match = finalTitle.match(datePattern)
        if (match) {
            const dateFormat = match[1]
            const formattedDate = moment(pageCreatedWhen).format(dateFormat)
            finalTitle = finalTitle.replace(datePattern, formattedDate)
        }

        return finalTitle.trim()
    }

    async createPageUpdate(
        item,
        pkmType,
        syncDateFormat,
        customTags,
        pageTitleFormat,
    ) {
        const fileName = this.processPageTitleFormat(
            pageTitleFormat,
            item.data.pageTitle,
            item.data.pageCreatedWhen,
        )

        let [pageHeader, annotationsSection] = [null, null]
        let fileContent = ''

        let page
        try {
            page = await this.backendNew.retrievePage(fileName, pkmType)
        } catch (e) {}

        if (page) {
            ;[pageHeader, annotationsSection] = page.split('### Annotations\n')

            if (item.type === 'page') {
                pageHeader = this.extractAndUpdatePageData(
                    pageHeader ||
                        this.pageObjectDefault(
                            item.data.pageTitle,
                            item.data.pageUrl,
                            item.data.pageSpaces || null,
                            item.data.pageCreatedWhen ?? item.data.createdWhen,
                            item.data.type,
                            pkmType,
                            syncDateFormat,
                            pageTitleFormat,
                        ),
                    item.data.pageTitle || null,
                    item.data.pageURL || null,
                    item.data.pageSpaces || null,
                    item.data.pageCreatedWhen ?? item.data.createdWhen,
                    item.data.type || null,
                    pkmType,
                    syncDateFormat,
                    customTags,
                    pageTitleFormat,
                )
            } else if (item.type === 'annotation') {
                annotationsSection = this.replaceOrAppendAnnotation(
                    annotationsSection,
                    item,
                    pkmType,
                    syncDateFormat,
                )
            }
        } else {
            let spaces = []
            let spacesString = ''
            if (customTags) {
                if (customTags.includes(',')) {
                    customTags.split(',').map((tag) => spaces.push(tag.trim()))
                } else {
                    spaces.push(customTags)
                }
            }

            if (item.data.pageSpaces) {
                spaces.push(item.data.pageSpaces)
            }
            if (item.data.annotationSpaces) {
                spaces.push(item.data.annotationSpaces)
            }

            if (pkmType === 'obsidian' && item.type === 'page') {
                spacesString = spaces
                    .map((space) => ` - "[[${space}]]"\n`)
                    .join('')
            }
            if (pkmType === 'logseq') {
                spacesString = spaces.map((space) => `[[${space}]]`).join(' ')
            }
            if (pkmType === 'obsidian' && item.type === 'annotation') {
                spacesString = spaces.map((space) => `[[${space}]]`).join(', ')
            }

            pageHeader = this.pageObjectDefault(
                item.data.pageTitle,
                item.data.pageUrl,
                item.type === 'page' ? spacesString : null,
                item.data.pageCreatedWhen || item.data.createdWhen,
                item.data.type,
                pkmType,
                syncDateFormat,
                pageTitleFormat,
            )

            if (item.type === 'annotation' || item.type === 'note') {
                annotationsSection = this.annotationObjectDefault(
                    item.data.annotationId,
                    item.data.body
                        ? convertHTMLintoMarkdown(item.data.body)
                        : '',
                    item.data.comment,
                    spacesString,
                    moment(item.data.createdWhen).format(
                        `${syncDateFormat} hh:mma`,
                    ),
                    item.data.type,
                    pkmType,
                    syncDateFormat,
                )
            }
        }

        fileContent =
            pageHeader + '### Annotations\n' + (annotationsSection || '')

        return await this.backendNew.storeObject(fileName, fileContent, pkmType)
    }

    replaceOrAppendAnnotation(
        annotationsSection,
        item,
        pkmType,
        syncDateFormat,
    ) {
        let annotationStartIndex
        let annotationEndIndex
        if (pkmType === 'obsidian' && annotationsSection != null) {
            const annotationStartLine = `<span class="annotationStartLine" id="${item.data.annotationId}"></span>\n`
            const annotationEndLine = `<span class="annotationEndLine" id="${item.data.annotationId}"> --- </span>\n`
            annotationStartIndex = annotationsSection.indexOf(
                annotationStartLine,
            )
            if (annotationStartIndex !== -1) {
                const annotationEndIndex = annotationsSection.indexOf(
                    annotationEndLine,
                    annotationStartIndex,
                )

                const annotationContent = annotationsSection.slice(
                    annotationStartIndex,
                    annotationEndIndex,
                )

                const newAnnotationContent = this.extractAndUpdateAnnotationData(
                    annotationContent,
                    item.data.annotationId,
                    item.data.body,
                    item.data.comment,
                    item.data.annotationSpaces,
                    item.data.createdWhen,
                    item.data.type,
                    pkmType,
                    syncDateFormat,
                )

                return (
                    annotationsSection.slice(0, annotationStartIndex) +
                    newAnnotationContent +
                    annotationsSection.slice(
                        annotationEndIndex + annotationEndLine?.length,
                    )
                )
            }
        }
        if (pkmType === 'logseq' && annotationsSection != null) {
            let annotationStartLine = `- <!-- NoteStartLine ${item.data.annotationId} -->---\n`
            const annotationEndLine = ` <!-- NoteEndLine ${item.data.annotationId} -->\n\n`
            annotationStartIndex = annotationsSection.indexOf(
                annotationStartLine,
            )
            annotationEndIndex = annotationsSection.indexOf(annotationEndLine)

            if (annotationEndIndex !== -1 && annotationStartIndex !== -1) {
                const annotationContent = annotationsSection.slice(
                    annotationStartIndex,
                    annotationEndIndex,
                )

                const newAnnotationContent = this.extractAndUpdateAnnotationData(
                    annotationContent,
                    item.data.annotationId,
                    item.data.body,
                    item.data.comment,
                    item.data.annotationSpaces,
                    item.data.createdWhen,
                    item.data.type,
                    pkmType,
                    syncDateFormat,
                )

                return (
                    annotationsSection.slice(0, annotationStartIndex) +
                    newAnnotationContent +
                    annotationsSection.slice(
                        annotationEndIndex + annotationEndLine?.length,
                    )
                )
            }
        }

        if (annotationStartIndex === -1 || annotationsSection === null) {
            const newAnnotationContent = this.annotationObjectDefault(
                item.data.annotationId,
                item.data.body ? convertHTMLintoMarkdown(item.data.body) : '',
                item.data.comment,
                item.data.annotationSpaces
                    ? `[[${item.data.annotationSpaces}]]`
                    : null,
                moment(item.data.createdWhen).format(
                    `${syncDateFormat} hh:mma`,
                ),
                item.data.type,
                pkmType,
                syncDateFormat,
            )
            if (!annotationsSection) {
                return newAnnotationContent
            } else {
                return annotationsSection + newAnnotationContent
            }
        }
    }

    extractAndUpdateAnnotationData(
        annotationContent,
        annotationId,
        body,
        comment,
        annotationSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
    ) {
        let annotation = annotationContent
        let updatedAnnotation
        let annotationNoteContent = null

        if (pkmType === 'obsidian') {
            // Find and remove the annotation start and end lines from the annotation string
            const annotationStartLine = `<span class="annotationStartLine" id="${annotationId}"></span>\n`
            const annotationEndLine = `<span class="annotationEndLine" id="${annotationId}"> --- </span>\n`
            annotation = annotation.replace(annotationStartLine, '')
            annotation = annotation.replace(annotationEndLine, '')

            // Extract data from the annotation
            let highlightTextMatch
            highlightTextMatch = annotation.match(/> \s*(.+)\n\n/)

            const noteStartString = `<!-- Note -->\n`
            const annotationNoteStartIndex = annotation.indexOf(noteStartString)
            const annotationNoteEndIndex = annotation.indexOf(
                '\n<div id="end"/>\n\r',
            )
            if (
                annotationNoteStartIndex !== -1 &&
                annotationNoteEndIndex !== -1
            ) {
                annotationNoteContent = annotation.slice(
                    annotationNoteStartIndex + noteStartString?.length,
                    annotationNoteEndIndex,
                )
            }

            const creationDateMatch = annotation.match(
                /<!-- Created at -->\n(.+)\n/,
            )

            const spacesMatch = annotation.match(/<!-- Spaces -->\n(.+)\n\n/)

            const newHighlightText =
                convertHTMLintoMarkdown(body) ??
                (highlightTextMatch ? highlightTextMatch[1] : null)
            const newHighlightNote =
                comment ||
                (annotationNoteContent ? annotationNoteContent : null)

            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) ||
                moment(creationDate).format(`${syncDateFormat} hh:mma`)

            const existingSpaces = spacesMatch
                ? spacesMatch[1]
                      .split(', ')
                      .map((space) => space.replace(/\[\[(.+)\]\]/, '$1'))
                : []
            if (annotationSpaces) {
                const index = existingSpaces.indexOf(annotationSpaces)
                if (index !== -1) {
                    existingSpaces.splice(index, 1)
                } else {
                    existingSpaces.push(annotationSpaces)
                }
            }

            const formattedSpaces = existingSpaces
                .map((space) => `[[${space}]]`)
                .join(', ')

            updatedAnnotation = this.annotationObjectDefault(
                annotationId,
                newHighlightText,
                newHighlightNote,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
            )
        }

        if (pkmType === 'logseq') {
            // find content inside annotation string
            let highlightTextMatch = annotation.match(/ - >\s*(.+)\n/)

            const HighlightNoteMatch = annotation.match(
                /  - \*\*Note\*\* \n    - (.+)\n/,
            )
            const creationDateMatch = annotation.match(/Created at:\*\* (.+)\r/)
            const spacesMatch = annotation.match(/  - \*\*Spaces:\*\* (.+)\n/)

            const newHighlightText =
                convertHTMLintoMarkdown(body) ??
                (highlightTextMatch ? highlightTextMatch[1] : null)
            const newHighlightNote =
                comment || (HighlightNoteMatch ? HighlightNoteMatch[1] : null)
            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) ||
                moment(creationDate).format(`${syncDateFormat} hh:mma`)

            const existingSpaces = spacesMatch
                ? spacesMatch[1]
                      .split(' ')
                      .map((space) => space.replace(/\[\[(.+)\]\]/, '$1'))
                : []

            // replace content
            if (annotationSpaces) {
                const index = existingSpaces.indexOf(annotationSpaces)
                if (index !== -1) {
                    existingSpaces.splice(index, 1)
                } else {
                    existingSpaces.push(annotationSpaces)
                }
            }
            const formattedSpaces = existingSpaces
                .map((space) => `[[${space}]]`)
                .join(' ')

            updatedAnnotation = this.annotationObjectDefault(
                annotationId,
                newHighlightText,
                newHighlightNote,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
            )
        }

        return updatedAnnotation
    }

    extractAndUpdatePageData(
        pageHeader,
        pageTitle,
        pageURL,
        pageSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
        customTags,
        pageTitleFormat,
    ) {
        let createdWhen = creationDate
        let updatedPageHeader

        if (pkmType === 'obsidian') {
            // Extract data from pageHeader
            const titleMatch = pageHeader.match(/Title: (.+)/)
            const urlMatch = pageHeader.match(/Url: (.+)/)
            const creationDateMatch = pageHeader.match(/Created at: (.+)/)
            const newTitle = (titleMatch ? titleMatch[1] : null) || pageTitle
            const newURL = (urlMatch ? urlMatch[1] : null) || pageURL
            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) || createdWhen

            let lines = pageHeader.split('\n')
            let spacesStartIndex = lines.findIndex((line) =>
                line.startsWith('Spaces:'),
            )
            let spaces = []

            if (spacesStartIndex !== -1) {
                for (let i = spacesStartIndex + 1; i < lines?.length; i++) {
                    let line = lines[i]
                    let match = line.match(/^ - "\[\[(.+)\]\]"$/)
                    if (match) {
                        let content = match[1]
                        spaces.push(content)
                    } else {
                        break // Stop when we reach a line that doesn't match the pattern
                    }
                }
            }

            if (pageSpaces) {
                const index = spaces.indexOf(pageSpaces)
                if (index !== -1) {
                    spaces.splice(index, 1)
                } else {
                    spaces.push(pageSpaces)
                }
            }

            let tagsArray = []
            if (customTags) {
                tagsArray = customTags.split(',')
                let tagsArrayTrimmed = tagsArray.map((tag) => tag.trim())
                tagsArrayTrimmed.forEach((tag) => {
                    if (spaces.indexOf(tag) === -1) {
                        spaces.push(tag)
                    }
                })
            }

            const formattedSpaces = spaces
                .map((space) => ` - "[[${space}]]"\n`)
                .join('')

            updatedPageHeader = this.pageObjectDefault(
                newTitle,
                newURL,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
                pageTitleFormat,
            )
        }
        if (pkmType === 'logseq') {
            // Extract data from pageHeader
            const titleMatch = pageHeader.match(/pagetitle:: (.+)/)
            const urlMatch = pageHeader.match(/pageurl:: (.+)/)
            const creationDateMatch = pageHeader.match(/createdat:: (.+)/)

            // set new values or keep old ones
            const newTitle = (titleMatch ? titleMatch[1] : null) || pageTitle
            const newURL = (urlMatch ? urlMatch[1] : null) || pageURL
            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) || createdWhen

            // Step 1: Extract content inside [[]] from the line starting with "spaces::" and put them into an array
            let spaces = []
            let spacesLine = pageHeader
                .split('\n')
                .find((line) => line.startsWith('spaces::'))
            if (spacesLine) {
                let spacesMatch = spacesLine.match(/\[\[(.+?)\]\]/g)
                if (spacesMatch) {
                    spaces = spacesMatch.map((space) => space.slice(2, -2))
                }
            }

            let tagsArray = []
            if (customTags) {
                tagsArray = customTags.split(',')
                let tagsArrayTrimmed = tagsArray.map((tag) => tag.trim())
                tagsArrayTrimmed.forEach((tag) => {
                    if (spaces.indexOf(tag) === -1) {
                        spaces.push(tag)
                    }
                })
            }

            // Step 2: Check if "pageSpaces" value is inside this array
            const index = spaces.indexOf(pageSpaces)
            if (index !== -1) {
                // a) If yes, remove it from the spaces array
                spaces.splice(index, 1)
            } else {
                // b) If not, add it to the array
                spaces.push(pageSpaces)
            }

            // Step 3: Create a string with all the items of the spaces array and add back the [[]] around them
            const formattedSpaces = spaces
                .map((space) => `[[${space}]]`)
                .join(' ')

            updatedPageHeader = this.pageObjectDefault(
                newTitle,
                newURL,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
                pageTitleFormat,
            )
        }

        return updatedPageHeader
    }

    pageObjectDefault(
        pageTitle,
        pageURL,
        pageSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
        pageTitleFormat,
    ) {
        let createdWhen = creationDate
        let titleLine
        let urlLine
        let creationDateLine
        let spacesLine
        let pageSeparator
        let warning = ''
        if (pkmType === 'obsidian' && typeof createdWhen === 'number') {
            createdWhen = `"[[${moment
                .unix(createdWhen / 1000)
                .format(syncDateFormat)}]]"`
        } else if (pkmType === 'logseq' && typeof createdWhen === 'number') {
            createdWhen = `[[${moment
                .unix(createdWhen / 1000)
                .format(syncDateFormat)}]]`
        }

        if (pkmType === 'obsidian') {
            titleLine = `Title: ${pageTitle}\n`
            urlLine = `Url: ${pageURL}\n`
            creationDateLine = `Created at: ${createdWhen}\n`
            spacesLine = pageSpaces ? `Spaces: \n${pageSpaces}` : ''
            pageSeparator = '---\n'
            warning = !this.PKMSYNCremovewarning
                ? '```\n❗️You can edit this file, though be aware that updates via Memex to an individual highlight will overwrite the changes you made to it in here. For feedback, go to memex.garden/chatSupport.\n```\n'
                : ''
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

        if (pkmType === 'logseq') {
            urlLine = `pageurl:: ${pageURL}\n`
            titleLine = `pagetitle:: ${pageTitle}\n`
            creationDateLine = `createdat:: ${createdWhen}\n`

            spacesLine = pageSpaces ? `spaces:: ${pageSpaces}\n` : ''
            warning = !this.PKMSYNCremovewarning
                ? '- ```\n❗️You can edit this file, though be aware that updates via Memex to an individual highlight will overwrite the changes you made to it in here. For feedback, go to memex.garden/chatSupport.\n```\n'
                : ''

            return titleLine + urlLine + creationDateLine + spacesLine + warning
        }
    }

    annotationObjectDefault(
        annotationId,
        body,
        comment,
        annotationSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
    ) {
        const commentWithImageLinks = resolveImgSrc(
            comment,
            process.env.NODE_ENV,
        )
        const bodyWithImageLinks = resolveImgSrc(body, process.env.NODE_ENV)

        if (pkmType === 'obsidian') {
            const annotationStartLine = `<span class="annotationStartLine" id="${annotationId}"></span>\n`
            let highlightTextLine = bodyWithImageLinks
                ? `> ${bodyWithImageLinks.trim()}\n\n`
                : ''
            const highlightNoteLine = commentWithImageLinks
                ? `<!-- Note -->\n${convertHTMLintoMarkdown(
                      commentWithImageLinks,
                  )}\n<div id="end"/>\n\r`
                : ''
            const highlightSpacesLine = annotationSpaces
                ? `<!-- Spaces -->\n${`${annotationSpaces}`}\n\n`
                : ''
            const creationDateLine = `<!-- Created at -->\n${creationDate}\n`
            const annotationEndLine = `\r<span class="annotationEndLine" id="${annotationId}"> --- </span>\n`

            return (
                annotationStartLine +
                highlightTextLine +
                highlightNoteLine +
                highlightSpacesLine +
                creationDateLine +
                annotationEndLine
            )
        }
        if (pkmType === 'logseq') {
            let highlightTextLine = ''
            const separatedLine = `- <!-- NoteStartLine ${annotationId} -->---\n`
            highlightTextLine = bodyWithImageLinks
                ? ` - > ${bodyWithImageLinks}\n`
                : ''

            const highlightNoteLine = commentWithImageLinks
                ? `  - **Note** \n    - ${convertHTMLintoMarkdown(
                      commentWithImageLinks,
                  )}\n`
                : ''
            const highlightSpacesLine = annotationSpaces
                ? `  - **Spaces:** ${annotationSpaces}\n`
                : ''
            const creationDateLine = `  - **Created at:** ${creationDate}\r`
            const annotationEndLine = ` <!-- NoteEndLine ${annotationId} -->\n\n`
            return (
                separatedLine +
                highlightTextLine +
                highlightNoteLine +
                highlightSpacesLine +
                creationDateLine +
                annotationEndLine
            )
        }
    }
}

function convertHTMLintoMarkdown(html: string) {
    let markdown = htmlToMarkdown(html, (turndownService) => {
        // Add a rule for handling paragraphs to remove extra newlines
        turndownService.addRule('paragraph', {
            filter: 'p',
            replacement: function (content) {
                // Trim the content to remove leading and trailing whitespace
                // and return the content with a single newline at the end
                return content.trim() + '\n'
            },
        })
    })

    // The following replacements might not be necessary anymore if the custom rule handles the conversion correctly
    markdown = markdown.replace(/[\\](?!\n)/g, '')

    return markdown
}
