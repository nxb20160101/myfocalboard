// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"database/sql"

	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/plugin"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type storeService interface {
	GetMasterDB() (*sql.DB, error)
}

// normalizeAppError returns a truly nil error if appErr is nil
// See https://golang.org/doc/faq#nil_error for more details.
func normalizeAppErr(appErr *mm_model.AppError) error {
	if appErr == nil {
		return nil
	}
	return appErr
}

// pluginAPIAdapter is an adapter that ensures all Plugin API methods have the same signature as the
// services API.
// Note: this will be removed when plugin builds are no longer needed.
type pluginAPIAdapter struct {
	api          plugin.API
	storeService storeService
	logger       mlog.LoggerIFace
}

func newServiceAPIAdapter(api plugin.API, storeService storeService, logger mlog.LoggerIFace) *pluginAPIAdapter {
	return &pluginAPIAdapter{
		api:          api,
		storeService: storeService,
		logger:       logger,
	}
}

//
// Channels service.
//

func (a *pluginAPIAdapter) GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error) {
	channel, appErr := a.api.GetDirectChannel(userID1, userID2)
	return channel, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetChannelByID(channelID string) (*mm_model.Channel, error) {
	channel, appErr := a.api.GetChannel(channelID)
	return channel, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetChannelMember(channelID string, userID string) (*mm_model.ChannelMember, error) {
	member, appErr := a.api.GetChannelMember(channelID, userID)
	return member, normalizeAppErr(appErr)
}

//
// Post service.
//

func (a *pluginAPIAdapter) CreatePost(post *mm_model.Post) (*mm_model.Post, error) {
	post, appErr := a.api.CreatePost(post)
	return post, normalizeAppErr(appErr)
}

//
// User service.
//

func (a *pluginAPIAdapter) GetUserByID(userID string) (*mm_model.User, error) {
	user, appErr := a.api.GetUser(userID)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetUserByUsername(name string) (*mm_model.User, error) {
	user, appErr := a.api.GetUserByUsername(name)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetUserByEmail(email string) (*mm_model.User, error) {
	user, appErr := a.api.GetUserByEmail(email)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) UpdateUser(user *mm_model.User) (*mm_model.User, error) {
	user, appErr := a.api.UpdateUser(user)
	return user, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) GetUsersFromProfiles(options *mm_model.UserGetOptions) ([]*mm_model.User, error) {
	users, appErr := a.api.GetUsers(options)
	return users, normalizeAppErr(appErr)
}

//
// Team service.
//

func (a *pluginAPIAdapter) GetTeamMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	member, appErr := a.api.GetTeamMember(teamID, userID)
	return member, normalizeAppErr(appErr)
}

func (a *pluginAPIAdapter) CreateMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	member, appErr := a.api.CreateTeamMember(teamID, userID)
	return member, normalizeAppErr(appErr)
}

//
// Permissions service.
//

func (a *pluginAPIAdapter) HasPermissionToTeam(userID, teamID string, permission *mm_model.Permission) bool {
	return a.api.HasPermissionToTeam(userID, teamID, permission)
}

//
// Bot service.
//
func (a *pluginAPIAdapter) EnsureBot(bot *mm_model.Bot) (string, error) {
	return a.api.EnsureBotUser(bot)
}

//
// License service.
//
func (a *pluginAPIAdapter) GetLicense() *mm_model.License {
	return a.api.GetLicense()
}

//
// FileInfoStore service.
//
func (a *pluginAPIAdapter) GetFileInfo(fileID string) (*mm_model.FileInfo, error) {
	fi, appErr := a.api.GetFileInfo(fileID)
	return fi, normalizeAppErr(appErr)
}

//
// Cluster store.
//
func (a *pluginAPIAdapter) PublishWebSocketEvent(event string, payload map[string]interface{}, broadcast *mm_model.WebsocketBroadcast) {
	a.api.PublishWebSocketEvent(event, payload, broadcast)
}

func (a *pluginAPIAdapter) PublishPluginClusterEvent(ev mm_model.PluginClusterEvent, opts mm_model.PluginClusterEventSendOptions) error {
	return a.api.PublishPluginClusterEvent(ev, opts)
}

//
// Cloud service.
//
func (a *pluginAPIAdapter) GetCloudLimits() (*mm_model.ProductLimits, error) {
	return a.api.GetCloudLimits()
}

//
// Config service.
//
func (a *pluginAPIAdapter) GetConfig() *mm_model.Config {
	return a.api.GetUnsanitizedConfig()
}

//
// Logger service.
//
func (a *pluginAPIAdapter) GetLogger() mlog.LoggerIFace {
	return a.logger
}

//
// KVStore service.
//
func (a *pluginAPIAdapter) KVSetWithOptions(key string, value []byte, options mm_model.PluginKVSetOptions) (bool, error) {
	b, appErr := a.api.KVSetWithOptions(key, value, options)
	return b, normalizeAppErr(appErr)
}

//
// Store service.
//
func (a *pluginAPIAdapter) GetMasterDB() (*sql.DB, error) {
	return a.storeService.GetMasterDB()
}

//
// System service.
//
func (a *pluginAPIAdapter) GetDiagnosticId() string {
	return a.api.GetDiagnosticId()
}

// Ensure the adapter implements ServicesAPI.
var _ model.ServicesAPI = &pluginAPIAdapter{}