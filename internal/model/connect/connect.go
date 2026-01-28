package model

// Connect 定义可读取的连接信息
type Connect struct {
	ServerName  string `json:"server_name"`  // 服务器名称
	ServerURL   string `json:"server_url"`   // 服务器地址
	Logo        string `json:"logo"`         // 站点logo
	TotalEchos  int    `json:"total_echos"`  // 总共发布数量
	TodayEchos  int    `json:"today_echos"`  // 今日发布数量
	SysUsername string `json:"sys_username"` // 系统管理员用户名
}

// Connected 定义添加的连接信息
type Connected struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	ConnectURL string `                  json:"connect_url"` // 连接地址
}

// ConnectHealth 定义连接健康状态
type ConnectHealth struct {
	ID         uint   `json:"id"`
	ConnectURL string `json:"connect_url"`
	IsHealthy  bool   `json:"is_healthy"`
	Message    string `json:"message"`
}
