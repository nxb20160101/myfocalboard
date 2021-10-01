// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactElement} from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'
import configureStore from 'redux-mock-store'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {IntlProvider} from 'react-intl'
import {mocked} from 'ts-jest/utils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import mutator from '../../mutator'

import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

const wrapIntl = (children: ReactElement) => (
    <IntlProvider locale='en'>{children}</IntlProvider>
)
const board = TestBlockFactory.createBoard()
const activeView = TestBlockFactory.createBoardView(board)
const propertyName = 'Status'

describe('components/viewHeader/viewHeaderGroupByMenu', () => {
    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'},
        },
    }
    const mockStore = configureStore([])
    const store = mockStore(state)
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return groupBy menu', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderGroupByMenu
                        activeView={activeView}
                        groupByPropertyName={propertyName}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('return groupBy menu and groupBy Status', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderGroupByMenu
                        activeView={activeView}
                        groupByPropertyName={propertyName}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        const buttonStatus = screen.getByRole('button', {name: 'Status'})
        userEvent.click(buttonStatus)
        expect(container).toMatchSnapshot()
    })
})
