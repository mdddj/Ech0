package service

import model "github.com/lin-snow/ech0/internal/model/connect"

type ConnectServiceInterface interface {
	// AddConnect 添加连接
	AddConnect(userid uint, connected model.Connected) error

	// DeleteConnect 删除连接
	DeleteConnect(userid, id uint) error

	// GetConnect 提供当前实例的连接信息
	GetConnect() (model.Connect, error)

	// GetConnectsInfo 获取实例获取到的其它实例的连接信息
	GetConnectsInfo() ([]model.Connect, error)

	// GetConnects 获取实例添加的所有连接
	GetConnects() ([]model.Connected, error)

	// CheckConnectsHealth 检测所有连接的健康状态
	CheckConnectsHealth() ([]model.ConnectHealth, error)

	// CleanInvalidConnects 清理失效的连接
	CleanInvalidConnects(userid uint) (int, error)
}
