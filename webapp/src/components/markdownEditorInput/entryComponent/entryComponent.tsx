// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactElement} from 'react'
import {EntryComponentProps} from '@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry'

import GuestBadge from '../../../widgets/guestBadge'

import './entryComponent.scss'

const BotBadge = (window as any).Components?.BotBadge

const Entry = (props: EntryComponentProps): ReactElement => {
    const {
        mention,
        theme,
        ...parentProps
    } = props

    return (
        <div
            {...parentProps}
        >
            <div className={`${theme?.mentionSuggestionsEntryContainer} EntryComponent`}>
                <img
                    src={mention.avatar}
                    className={theme?.mentionSuggestionsEntryAvatar}
                    role='presentation'
                />
                <div className={theme?.mentionSuggestionsEntryText}>
                    {mention.name}
                    {BotBadge && <BotBadge show={mention.is_bot}/>}
                    <GuestBadge show={mention.is_guest}/>
                </div>
                <div className={theme?.mentionSuggestionsEntryText}>
                    {mention.displayName}
                </div>
            </div>
        </div>
    )
}

export default Entry
