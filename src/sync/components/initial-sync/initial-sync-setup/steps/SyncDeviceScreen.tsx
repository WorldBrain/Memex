import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

export const SyncDeviceScreen = ({
    error,
    stage,
    progressPct,
}: {
    error?: string
    stage: number
    progressPct?: number
}) => {
    return (
        <ModalBox header={'Setup sync with mobile devices'} actions={[]}>
            <div>
                <div>
                    <div>
                        {'Initial sync is in progress... this may take a while'}
                    </div>
                    <div>{'Make sure both devices stay connected'}</div>

                    <div>
                        {!error ? (
                            <div>
                                <Link
                                    label={'Cancel syncing'}
                                    onClick={() => false}
                                />
                                {progressPct === undefined ? (
                                    <LoadingIndicator />
                                ) : (
                                    <div>
                                        <ProgressBar progress={progressPct} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Link
                                    label={'retry syncing'}
                                    onClick={() => false}
                                />
                                Something went wrong
                            </div>
                        )}
                    </div>
                    <div>
                        <span>{'Problem with syncing?'}</span>
                        <ExternalLink
                            label={'Send a bug report'}
                            onClick={() => false}
                        />
                        <ExternalLink
                            label={'Help & FAQ'}
                            onClick={() => false}
                        />
                    </div>
                </div>
            </div>
        </ModalBox>
    )
}
