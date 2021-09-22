// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {
    Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import {createBrowserHistory} from 'history'

import TelemetryClient from './telemetry/telemetryClient'

import {getMessages} from './i18n'
import {FlashMessages} from './components/flashMessages'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import DashboardPage from './pages/dashboard/dashboardPage'
import WelcomePage from './pages/welcome/welcomePage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {Utils} from './utils'
import wsClient from './wsclient'
import {fetchMe, getLoggedIn, getMe} from './store/users'
import {getLanguage, fetchLanguage} from './store/language'
import {setGlobalError, getGlobalError} from './store/globalError'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {fetchClientConfig} from './store/clientConfig'

import {IUser} from './user'

export const history = createBrowserHistory({basename: Utils.getFrontendBaseURL()})

if (Utils.isDesktop() && Utils.isFocalboardPlugin()) {
    window.addEventListener('message', (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
            return
        }

        const pathName = event.data.message?.pathName
        if (!pathName) {
            return
        }

        history.replace(pathName.replace((window as any).frontendBaseURL, ''))
    })
}

const browserHistory = {
    ...history,
    push: (path: string, ...args: any[]) => {
        if (Utils.isDesktop() && Utils.isFocalboardPlugin()) {
            window.postMessage(
                {
                    type: 'browser-history-push',
                    message: {
                        path: `${(window as any).frontendBaseURL}${path}`,
                    },
                },
                window.location.origin,
            )
        } else {
            history.push(path, ...args)
        }
    },
}

const App = React.memo((): JSX.Element => {
    const language = useAppSelector<string>(getLanguage)
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const globalError = useAppSelector<string>(getGlobalError)
    const me = useAppSelector<IUser|null>(getMe)
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(fetchLanguage())
        dispatch(fetchMe())
        dispatch(fetchClientConfig())
    }, [])

    useEffect(() => {
        wsClient.open()
        return () => {
            wsClient.close()
        }
    }, [])

    useEffect(() => {
        if (me) {
            TelemetryClient.setUser(me)
        }
    }, [me])

    let globalErrorRedirect = null
    if (globalError) {
        globalErrorRedirect = <Route path='/*'><Redirect to={`/error?id=${globalError}`}/></Route>
        setTimeout(() => dispatch(setGlobalError('')), 0)
    }

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <FlashMessages milliseconds={2000}/>
                <Router
                    history={browserHistory}
                >
                    <div id='frame'>
                        <div id='main'>
                            <Switch>
                                {globalErrorRedirect}
                                <Route path='/error'>
                                    <ErrorPage/>
                                </Route>
                                <Route path='/login'>
                                    <LoginPage/>
                                </Route>
                                <Route path='/register'>
                                    <RegisterPage/>
                                </Route>
                                <Route path='/change_password'>
                                    <ChangePasswordPage/>
                                </Route>
                                <Route path='/shared/:boardId?/:viewId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route
                                    path='/board/:boardId?/:viewId?/:cardId?'
                                    render={({match}) => {
                                        if (loggedIn === false) {
                                            return <Redirect to='/login'/>
                                        }

                                        if (loggedIn === true && !localStorage.getItem('welcomePageViewed')) {
                                            const originalPath = `/board/${match.params.boardId || ''}/${match.params.viewId || ''}/${match.params.cardId || ''}`
                                            return <Redirect to={`/welcome?r=${originalPath}`}/>
                                        }

                                        if (loggedIn === true) {
                                            return <BoardPage/>
                                        }

                                        return null
                                    }}
                                />
                                <Route path='/workspace/:workspaceId/shared/:boardId?/:viewId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route
                                    path='/workspace/:workspaceId/:boardId?/:viewId?/:cardId?'
                                    render={({match}) => {
                                        const originalPath = `/workspace/${match.params.workspaceId}/${match.params.boardId || ''}/${match.params.viewId || ''}/${match.params.cardId || ''}`
                                        let redirectUrl = '/' + Utils.buildURL(originalPath)
                                        if (redirectUrl.indexOf('//') === 0) {
                                            redirectUrl = redirectUrl.slice(1)
                                        }
                                        if (loggedIn === false) {
                                            const loginUrl = `/login?r=${encodeURIComponent(redirectUrl)}`
                                            return <Redirect to={loginUrl}/>
                                        } else if (loggedIn === true) {
                                            if (!localStorage.getItem('welcomePageViewed')) {
                                                return <Redirect to={`/welcome?r=${originalPath}`}/>
                                            }

                                            return (
                                                <BoardPage/>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Route
                                    exact={true}
                                    path='/dashboard'
                                >
                                    <DashboardPage/>
                                </Route>
                                <Route
                                    exact={true}
                                    path='/welcome'
                                >
                                    <WelcomePage/>
                                </Route>
                                <Route
                                    path='/:boardId?/:viewId?/:cardId?'
                                    render={({match}) => {
                                        // Since these 3 path values are optional and they can be anything, we can pass /x/y/z and it will
                                        // match this route however these values may not be valid so we should at the very least check
                                        // board id for descisions made below
                                        const boardIdIsValidUUIDV4 = (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).test(match.params.boardId || '')

                                        if (loggedIn === false) {
                                            return <Redirect to='/login'/>
                                        }

                                        if (
                                            (
                                                loggedIn === true &&
                                                !localStorage.getItem('welcomePageViewed')
                                            ) ||
                                            (
                                                !boardIdIsValidUUIDV4 &&
                                                Utils.isFocalboardPlugin()
                                            )
                                        ) {
                                            const originalPath = `/${match.params.boardId || ''}/${match.params.viewId || ''}/${match.params.cardId || ''}`
                                            const queryString = boardIdIsValidUUIDV4 ? `r=${originalPath}` : ''
                                            return <Redirect to={`/welcome?${queryString}`}/>
                                        }

                                        if (loggedIn === true) {
                                            return <BoardPage/>
                                        }

                                        return null
                                    }}
                                />
                            </Switch>
                        </div>
                    </div>
                </Router>
            </DndProvider>
        </IntlProvider>
    )
})

export default App
