import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import {
    CenterText,
    TypographyBodyBold,
    TypographyBodyCenter,
    HelpBlock,
    StageBlock,
    ProgressBox,
    Warning,
    WhiteSpacer20,
    WhiteSpacer30,
} from 'src/common-ui/components/design-library/typography'

const styles = require('./styles.css')

export const SyncDeviceScreen = ({
    error,
    stage,
    progressPct,
    handleCancel,
    handleRetry,
    onClose,
}: {
    error?: string
    stage: string
    progressPct?: number
    handleCancel?: () => void
    handleRetry?: () => void
    onClose: () => void
}) => {
    return (
        <ModalBox
            header={'Setup sync with mobile devices'}
            actions={[]}
            key={`dialog-sync`}
        >
            <ProgressBox>
                <CenterText>
                    <div className={styles.progressBar}>
                        {!error ? (
                            <div className={styles.progressBox}>
                                <TypographyBodyBold>
                                    {
                                        'Initial sync is in progress... this may take a while'
                                    }
                                </TypographyBodyBold>
                                <TypographyBodyCenter>
                                    {'Make sure both devices stay connected'}
                                </TypographyBodyCenter>

                                <WhiteSpacer20 />
                                {progressPct === undefined ? (
                                    <LoadingIndicator />
                                ) : (
                                    <div className={styles.progressBar}>
                                        <ProgressBar
                                            progress={progressPct * 100}
                                        />
                                        <StageBlock>{`Stage ${stage}`}</StageBlock>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.progressBox}>
                                <Warning>⚠️ Something went wrong</Warning>
                                <TypographyBodyCenter>
                                    {error}
                                </TypographyBodyCenter>
                                <WhiteSpacer20 />
                            </div>
                        )}
                    </div>
                    <WhiteSpacer20 />
                    <HelpBlock>
                        <span>{'Problem with syncing? '}</span>
                        <ExternalLink
                            label={'Send a bug report'}
                            href={
                                'https://community.worldbrain.io/c/bug-reports'
                            }
                        />
                        <ExternalLink
                            label={'Help & FAQ'}
                            href={'https://worldbrain.io/help'}
                        />
                    </HelpBlock>
                </CenterText>
            </ProgressBox>
        </ModalBox>
    )
}
