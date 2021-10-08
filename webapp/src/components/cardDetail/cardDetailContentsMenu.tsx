// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useContext} from 'react'
import {FormattedMessage, IntlShape, useIntl} from 'react-intl'

import {BlockTypes} from '../../blocks/block'
import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import {contentRegistry} from '../content/contentRegistry'

import CardDetailContext from './cardDetailContext'

function addContentMenu(intl: IntlShape, type: BlockTypes): JSX.Element {
    const handler = contentRegistry.getHandler(type)
    if (!handler) {
        Utils.logError(`addContentMenu, unknown content type: ${type}`)
        return <></>
    }
    const cardDetail = useContext(CardDetailContext)
    const addNewElement = useCallback(async () => {
        const {card} = cardDetail
        const index = card.fields.contentOrder.length
        cardDetail.addNewBlock(handler, index)
    }, [cardDetail, handler])

    return (
        <Menu.Text
            key={type}
            id={type}
            name={handler.getDisplayText(intl)}
            icon={handler.getIcon()}
            onClick={addNewElement}
        />
    )
}

const CardDetailContentsMenu = React.memo(() => {
    const intl = useIntl()
    return (
        <div className='CardDetailContentsMenu content add-content'>
            <MenuWrapper>
                <Button>
                    <FormattedMessage
                        id='CardDetail.add-content'
                        defaultMessage='Add content'
                    />
                </Button>
                <Menu position='top'>
                    {contentRegistry.contentTypes.map((type) => addContentMenu(intl, type))}
                </Menu>
            </MenuWrapper>
        </div>
    )
})

export default CardDetailContentsMenu
