import React from 'react'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { runInBackground } from 'src/util/webextensionRPC'
import type { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { shareOptsToPrivacyLvl } from 'src/annotations/utils'

interface State extends ShareMenuCommonState {
    showLink: boolean
}

export interface Props extends ShareMenuCommonProps {
    isShared?: boolean
    annotationUrl: string
    shareImmediately?: boolean
}

export default class SingleNoteShareMenu extends React.PureComponent<
    Props,
    State
> {
    static MOD_KEY = getKeyName({ key: 'mod' })
    static ALT_KEY = getKeyName({ key: 'alt' })
    static defaultProps: Pick<Props, 'contentSharingBG' | 'annotationsBG'> = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
    }

    state: State = {
        link: '',
        showLink: false,
        loadState: 'pristine',
        shareState: 'pristine',
    }

    async componentDidMount() {
        const linkExists = await this.setRemoteLinkIfExists()

        if (!linkExists && this.props.shareImmediately) {
            await executeReactStateUITask<State, 'loadState'>(
                this,
                'loadState',
                async () => {
                    await this.shareAnnotation()
                },
            )
        }
    }

    private handleLinkCopy = () => this.props.copyLink(this.state.link)

    private setRemoteLinkIfExists = async (): Promise<boolean> => {
        const { annotationUrl, contentSharingBG, isShared } = this.props
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        if (!link) {
            return false
        }
        this.setState({ link, showLink: isShared })
        return true
    }

    private shareAnnotation = async (isBulkShareProtected?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToLists: true,
            skipPrivacyLevelUpdate: true,
        })

        await contentSharingBG.setAnnotationPrivacyLevel({
            annotation: annotationUrl,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare: true,
                isBulkShareProtected,
            }),
        })
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        await this.props.copyLink(link)

        this.props.postShareHook?.({
            isShared: true,
            isProtected: isBulkShareProtected,
        })
    }

    private unshareAnnotation = async (isBulkShareProtected?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        this.setState({ showLink: false })

        await contentSharingBG.setAnnotationPrivacyLevel({
            annotation: annotationUrl,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare: false,
                isBulkShareProtected,
            }),
        })

        this.props.postShareHook?.({
            isShared: false,
            isProtected: isBulkShareProtected,
        })
    }

    private handleSetShared = async (isBulkShareProtected?: boolean) => {
        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAnnotation(isBulkShareProtected)
            },
        )

        this.props.closeShareMenu({} as any)
        await p
    }

    private handleSetPrivate = async (isBulkShareProtected?: boolean) => {
        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAnnotation(isBulkShareProtected)
            },
        )

        this.props.closeShareMenu({} as any)
        await p
    }

    render() {
        return (
            <ShareAnnotationMenu
                link={this.state.link}
                showLink={this.state.showLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to this annotation"
                privacyOptionsTitleCopy="Set privacy for this annotation"
                isLoading={
                    this.state.shareState === 'running' ||
                    this.state.loadState === 'running'
                }
                privacyOptions={[
                    {
                        icon: 'webLogo',
                        title: 'Public',
                        hasProtectedOption: true,
                        onClick: this.handleSetShared,
                        isSelected: this.props.isShared,
                        shortcut: `shift+${SingleNoteShareMenu.MOD_KEY}+enter`,
                        description:
                            'Auto-added to Spaces the page is shared to',
                    },
                    {
                        icon: 'person',
                        title: 'Private',
                        hasProtectedOption: true,
                        onClick: this.handleSetPrivate,
                        isSelected: !this.props.isShared,
                        shortcut: '',
                        description: 'Private to you, until shared (in bulk)',
                    },
                ]}
                shortcutHandlerDict={{
                    // 'mod+shift+enter': this.handleSetProtected,
                    'mod+shift+enter': () => this.handleSetShared(false),
                    'mod+enter': async () => {
                        if (this.props.isShared) {
                            this.handleSetShared(false)
                        } else {
                            this.handleSetPrivate(false)
                        }
                    },
                    'alt+enter': () => this.handleSetPrivate(true),
                    'alt+shift+enter': () => this.handleSetShared(true),
                }}
            />
        )
    }
}
