# Ech0 Connect 健康检测和清理功能

## 功能概述

为 Ech0 Connect 添加了连接健康检测和一键清理失效连接的功能。

## 功能特性

### 1. 健康状态检测
- 并发检测所有已添加的连接
- 显示每个连接的健康状态（正常/失效）
- 显示详细的状态信息（服务器名称或错误原因）
- 检测超时时间：10秒

### 2. 一键清理失效连接
- 自动识别所有失效的连接
- 批量删除失效连接
- 显示清理结果（删除数量）
- 需要管理员权限

## 实现细节

### 后端实现

#### 1. 数据模型 (`internal/model/connect/connect.go`)
```go
type ConnectHealth struct {
    ID         uint   `json:"id"`
    ConnectURL string `json:"connect_url"`
    IsHealthy  bool   `json:"is_healthy"`
    Message    string `json:"message"`
}
```

#### 2. Service 层 (`internal/service/connect/connect.go`)
- `CheckConnectsHealth()`: 并发检测所有连接的健康状态
- `CleanInvalidConnects(userid uint)`: 清理失效连接（需要管理员权限）

#### 3. Handler 层 (`internal/handler/connect/connect.go`)
- `CheckConnectsHealth()`: GET `/connects/health` - 检测连接健康状态
- `CleanInvalidConnects()`: DELETE `/connects/clean` - 清理失效连接

#### 4. HTTP 工具 (`internal/util/http/http.go`)
- 新增 `GetWithContext()` 方法：支持带上下文的 HTTP GET 请求

#### 5. 路由注册 (`internal/router/connect.go`)
```go
appRouterGroup.AuthRouterGroup.GET("/connects/health", h.ConnectHandler.CheckConnectsHealth())
appRouterGroup.AuthRouterGroup.DELETE("/connects/clean", h.ConnectHandler.CleanInvalidConnects())
```

### 前端实现

#### 1. API 调用 (`web/src/service/api/connect.ts`)
```typescript
// 检测连接健康状态
export function fetchCheckConnectsHealth()

// 清理失效连接
export function fetchCleanInvalidConnects()
```

#### 2. TypeScript 类型定义 (`web/src/typings/app.d.ts`)
```typescript
type ConnectHealth = {
  id: number
  connect_url: string
  is_healthy: boolean
  message: string
}
```

#### 3. UI 组件 (`web/src/views/panel/modules/TheSetting/TheConnectSetting.vue`)

**新增按钮：**
- "检测状态" 按钮：触发健康检测
- "清理失效" 按钮：清理失效连接（仅在有失效连接时显示）

**新增表格列：**
- "状态" 列：显示每个连接的健康状态
  - ✓ 正常（绿色）
  - ✗ 失效（红色）
  - 未检测（灰色）

**响应式状态：**
- `isChecking`: 检测中状态
- `isCleaning`: 清理中状态
- `healthStatus`: 健康状态记录（以连接 ID 为键）
- `hasInvalidConnects`: 是否有失效连接（计算属性）

## 使用方法

1. 进入后台管理 → 设置 → Ech0 Connect
2. 点击"检测状态"按钮，等待检测完成
3. 查看每个连接的状态（正常/失效）
4. 如果有失效连接，点击"清理失效"按钮
5. 确认清理操作，系统将自动删除所有失效连接

## 技术亮点

1. **并发检测**：使用 goroutine 并发检测所有连接，提高检测效率
2. **超时控制**：使用 context 控制检测超时，避免长时间等待
3. **错误处理**：详细的错误信息，帮助用户了解连接失败原因
4. **权限控制**：清理操作需要管理员权限
5. **用户体验**：
   - 按钮禁用状态防止重复操作
   - 加载状态提示
   - 确认对话框防止误操作
   - Toast 提示操作结果

## 测试建议

1. 添加多个连接（包括有效和无效的）
2. 点击"检测状态"，验证状态显示是否正确
3. 点击"清理失效"，验证是否只删除失效连接
4. 验证非管理员用户无法执行清理操作
5. 验证检测超时机制是否正常工作

## 版本信息

- 后端版本：v3.1.0
- 前端框架：Vue 3 + TypeScript
- 实现日期：2026-01-28
