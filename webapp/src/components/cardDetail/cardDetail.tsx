// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import {Board} from '../../blocks/board'
import {CommentBlock} from '../../blocks/commentBlock'
import {ContentBlock} from '../../blocks/contentBlock'
import {ContentHandler} from '../content/contentRegistry'
import {Utils} from '../../utils'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import {Focusable} from '../../widgets/editable'
import EditableArea from '../../widgets/editableArea'
import EmojiIcon from '../../widgets/icons/emoji'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import BlockIconSelector from '../blockIconSelector'

import CommentsList from './commentsList'
import CardDetailContext, {CardDetailContextType} from './cardDetailContext'
import CardDetailContents from './cardDetailContents'
import CardDetailContentsMenu from './cardDetailContentsMenu'
import CardDetailProperties from './cardDetailProperties'
import useImagePaste from './imagePaste'

import './cardDetail.scss'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    card: Card
    comments: CommentBlock[]
    contents: Array<ContentBlock|ContentBlock[]>
    readonly: boolean
}

const CardDetail = (props: Props): JSX.Element|null => {
    const {card, comments} = props
    const [title, setTitle] = useState(card.title)
    const [serverTitle, setServerTitle] = useState(card.title)
    const titleRef = useRef<Focusable>(null)
    const saveTitle = useCallback(() => {
        if (title !== card.title) {
            mutator.changeTitle(card.id, card.title, title)
        }
    }, [card.title, title])

    const saveTitleRef = useRef<() => void>(saveTitle)
    saveTitleRef.current = saveTitle

    useImagePaste(card.id, card.fields.contentOrder, card.rootId)

    useEffect(() => {
        if (!title) {
            titleRef.current?.focus()
        }
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewCard, {card: card.id})
    }, [])

    useEffect(() => {
        if (serverTitle === title) {
            setTitle(card.title)
        }
        setServerTitle(card.title)
    }, [card.title, title])

    useEffect(() => {
        return () => {
            saveTitleRef.current && saveTitleRef.current()
        }
    }, [])

    const setRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        mutator.changeIcon(card.id, card.fields.icon, newIcon)
    }, [card.id, card.fields.icon])

    if (!card) {
        return null
    }

    const intl = useIntl()
    const [newBlockId, setNewBlockId] = useState('')

    const contextValue = useMemo<CardDetailContextType>(() => ({
        card,
        newBlockId,
        resetNewBlockId: () => {
            setNewBlockId('')
        },
        addNewBlock: async (handler: ContentHandler, index: number) => {
            const block = await handler.createBlock(card.rootId)
            block.parentId = card.id
            block.rootId = card.rootId
            const contentOrder = card.fields.contentOrder.slice()
            contentOrder.splice(index, 0, block.id)
            if (!handler) {
                Utils.logError(`ContentElement, unknown content type: ${block.type}`)
                return
            }
            setNewBlockId(block.id)
            const typeName = handler.getDisplayText(intl)
            const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
            await mutator.performAsUndoGroup(async () => {
                await mutator.insertBlock(block, description)
                await mutator.changeCardContentOrder(card.id, card.fields.contentOrder, contentOrder, description)
            })
        },
    }), [intl, card, newBlockId, setNewBlockId])

    return (
        <>
            <div className='CardDetail content'>
                <BlockIconSelector
                    block={card}
                    size='l'
                    readonly={props.readonly}
                />
                {!props.readonly && !card.fields.icon &&
                    <div className='add-buttons'>
                        <Button
                            onClick={setRandomIcon}
                            icon={<EmojiIcon/>}
                        >
                            <FormattedMessage
                                id='CardDetail.add-icon'
                                defaultMessage='Add icon'
                            />
                        </Button>
                    </div>}

                <EditableArea
                    ref={titleRef}
                    className='title'
                    value={title}
                    placeholderText='Untitled'
                    onChange={(newTitle: string) => setTitle(newTitle)}
                    saveOnEsc={true}
                    onSave={saveTitle}
                    onCancel={() => setTitle(props.card.title)}
                    readonly={props.readonly}
                    spellCheck={true}
                />

                {/* Property list */}

                <CardDetailProperties
                    board={props.board}
                    card={props.card}
                    contents={props.contents}
                    comments={props.comments}
                    cards={props.cards}
                    activeView={props.activeView}
                    views={props.views}
                    readonly={props.readonly}
                />

                {/* Comments */}

                <hr/>
                <CommentsList
                    comments={comments}
                    rootId={card.rootId}
                    cardId={card.id}
                    readonly={props.readonly}
                />
            </div>

            {/* Content blocks */}

            <div className='CardDetail content fullwidth content-blocks'>
                <CardDetailContext.Provider value={contextValue}>
                    <CardDetailContents
                        card={props.card}
                        contents={props.contents}
                        readonly={props.readonly}
                    />
                    {!props.readonly && <CardDetailContentsMenu/>}
                </CardDetailContext.Provider>
            </div>
        </>
    )
}

export default CardDetail
