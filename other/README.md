# Behavior Monitor Server

macOS 行为监控服务端，接收来自 BehaviorMonitor 应用的事件，存储到 SQLite 数据库，并提供 HTTP API 和 WebSocket 实时推送。

## 目录

- [快速开始](#快速开始)
- [架构概述](#架构概述)
- [端口说明](#端口说明)
- [HTTP API](#http-api)
- [WebSocket 实时推送](#websocket-实时推送)
- [事件类型详解](#事件类型详解)
- [数据结构定义](#数据结构定义)
- [数据库结构](#数据库结构)
- [完整示例代码](#完整示例代码)
- [macOS 客户端配置](#macos-客户端配置)

---

## 快速开始

```bash
# 编译
cd behavior-server
cargo build --release

# 运行
./target/release/behavior-server
```

启动后输出：
```
🚀 Behavior Monitor Server 启动
📡 macOS 客户端: ws://localhost:8080
🌐 Web 客户端:   ws://localhost:8081/ws
🌐 HTTP API:     http://localhost:8081
💾 数据库:       behavior_events.db
```

---

## 架构概述

```
┌─────────────────────┐     WebSocket (8080)     ┌──────────────────────┐
│  BehaviorMonitor    │ ──────────────────────▶  │                      │
│  (macOS App)        │      发送事件            │                      │
└─────────────────────┘                          │   behavior-server    │
                                                 │                      │
┌─────────────────────┐     WebSocket (8081/ws)  │   ┌──────────────┐   │
│  Web 客户端         │ ◀──────────────────────  │   │   SQLite     │   │
│  (浏览器)           │      实时推送            │   │   Database   │   │
└─────────────────────┘                          │   └──────────────┘   │
                                                 │                      │
┌─────────────────────┐     HTTP API (8081)      │                      │
│  任意 HTTP 客户端   │ ◀─────────────────────▶  │                      │
│  (curl/fetch/etc)   │      查询数据            └──────────────────────┘
└─────────────────────┘
```

---

## 端口说明

| 端口 | 协议 | 用途 |
|------|------|------|
| 8080 | WebSocket | macOS BehaviorMonitor 应用连接，发送事件 |
| 8081 | HTTP | REST API 查询接口 |
| 8081 | WebSocket (`/ws`) | Web 客户端连接，接收实时事件推送 |

---

## HTTP API

### 通用响应格式

所有 API 返回统一的 JSON 格式：

```json
{
  "success": true,
  "data": <响应数据>,
  "error": null
}
```

错误时：
```json
{
  "success": false,
  "data": null,
  "error": "错误信息"
}
```

### 时间筛选参数

所有查询接口支持以下可选参数：

| 参数 | 类型 | 格式 | 默认值 | 说明 |
|------|------|------|--------|------|
| `start` | string | `YYYY-MM-DD` | 今天 | 开始日期（包含） |
| `end` | string | `YYYY-MM-DD` | 今天 | 结束日期（包含） |

**注意**：不传参数时，默认查询**今天**的数据。

---

### API 1: 获取所有事件

获取指定时间范围内的所有事件（包括应用切换、通知、电池、系统事件等）。

**请求**
```
GET /api/events
GET /api/events?start=2025-12-19&end=2025-12-20
```

**curl 示例**
```bash
# 查询今天的所有事件
curl http://localhost:8081/api/events

# 查询指定日期范围
curl "http://localhost:8081/api/events?start=2025-12-19&end=2025-12-20"
```

**JavaScript 示例**
```javascript
// 查询今天的事件
const response = await fetch('http://localhost:8081/api/events');
const result = await response.json();
console.log(result.data);

// 查询指定日期范围
const params = new URLSearchParams({ start: '2025-12-19', end: '2025-12-20' });
const response2 = await fetch(`http://localhost:8081/api/events?${params}`);
```

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_id": "DA168C16-0560-4226-ACD0-FA7923F60FE1",
      "event_type": "app_foreground_changed",
      "timestamp": 1734681234,
      "timestamp_str": "2025-12-20 15:00:34",
      "device_id": "5CA6FC84-B6A0-5A7C-A6B8-985BFCA85455",
      "data": {
        "type": "foregroundChange",
        "data": {
          "fromApp": "Safari",
          "fromBundleId": "com.apple.Safari",
          "toApp": "Xcode",
          "toBundleId": "com.apple.dt.Xcode",
          "triggerSource": "dock_click",
          "toAppIcon": "iVBORw0KGgo..."
        }
      }
    },
    {
      "id": 2,
      "event_id": "B1234567-...",
      "event_type": "notification_received",
      "timestamp": 1734681300,
      "timestamp_str": "2025-12-20 15:01:40",
      "device_id": "5CA6FC84-B6A0-5A7C-A6B8-985BFCA85455",
      "data": {
        "type": "notification",
        "data": {
          "sourceBundleId": "com.tencent.qq",
          "appName": "QQ",
          "title": "张三",
          "body": "你好",
          "appIcon": "iVBORw0KGgo..."
        }
      }
    },
    {
      "id": 3,
      "event_id": "C1234567-...",
      "event_type": "battery_level_changed",
      "timestamp": 1734681400,
      "timestamp_str": "2025-12-20 15:03:20",
      "device_id": "5CA6FC84-B6A0-5A7C-A6B8-985BFCA85455",
      "data": {
        "type": "battery",
        "data": {
          "level": 85,
          "isCharging": true,
          "isPluggedIn": true
        }
      }
    }
  ],
  "error": null
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 数据库自增 ID |
| `event_id` | string | 事件唯一标识（UUID） |
| `event_type` | string | 事件类型，见[事件类型详解](#事件类型详解) |
| `timestamp` | number | Unix 时间戳（秒） |
| `timestamp_str` | string | 格式化时间字符串 |
| `device_id` | string | 设备唯一标识 |
| `data` | object | 事件数据，结构因 `event_type` 而异 |

---

### API 2: 获取通知列表

获取指定时间范围内的所有通知事件。

**请求**
```
GET /api/notifications
GET /api/notifications?start=2025-12-19&end=2025-12-20
```

**curl 示例**
```bash
curl http://localhost:8081/api/notifications
```

**JavaScript 示例**
```javascript
const response = await fetch('http://localhost:8081/api/notifications');
const result = await response.json();

result.data.forEach(notif => {
  console.log(`${notif.app_name}: ${notif.title} - ${notif.body}`);
});
```

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "source_bundle_id": "com.tencent.qq",
      "app_name": "QQ",
      "title": "张三",
      "subtitle": null,
      "body": "你好，在吗？",
      "app_icon": "iVBORw0KGgoAAAANSUhEUgAAAEAAAABA...",
      "timestamp": 1734681234,
      "timestamp_str": "2025-12-20 15:00:34"
    },
    {
      "id": 2,
      "source_bundle_id": "com.tencent.xinWeChat",
      "app_name": "微信",
      "title": "工作群",
      "subtitle": "李四",
      "body": "收到，马上处理",
      "app_icon": "iVBORw0KGgoAAAANSUhEUgAAAEAAAABA...",
      "timestamp": 1734681300,
      "timestamp_str": "2025-12-20 15:01:40"
    }
  ],
  "error": null
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 数据库自增 ID |
| `source_bundle_id` | string | 发送通知的应用 Bundle ID |
| `app_name` | string \| null | 应用名称 |
| `title` | string \| null | 通知标题 |
| `subtitle` | string \| null | 通知副标题 |
| `body` | string \| null | 通知正文 |
| `app_icon` | string \| null | 应用图标 Base64（PNG 格式） |
| `timestamp` | number | Unix 时间戳（秒） |
| `timestamp_str` | string | 格式化时间字符串 |

---

### API 3: 获取应用使用统计

获取指定时间范围内的应用使用统计，按切换次数排序。

**请求**
```
GET /api/app-usage
GET /api/app-usage?start=2025-12-19&end=2025-12-20
```

**curl 示例**
```bash
curl http://localhost:8081/api/app-usage
```

**JavaScript 示例**
```javascript
const response = await fetch('http://localhost:8081/api/app-usage');
const result = await response.json();

// 显示使用最多的前 5 个应用
result.data.slice(0, 5).forEach((app, index) => {
  console.log(`${index + 1}. ${app.app_name}: ${app.count} 次`);
});
```

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "app_name": "Xcode",
      "bundle_id": "com.apple.dt.Xcode",
      "count": 42,
      "total_seconds": 0
    },
    {
      "app_name": "Safari",
      "bundle_id": "com.apple.Safari",
      "count": 28,
      "total_seconds": 0
    },
    {
      "app_name": "微信",
      "bundle_id": "com.tencent.xinWeChat",
      "count": 15,
      "total_seconds": 0
    }
  ],
  "error": null
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `app_name` | string | 应用名称 |
| `bundle_id` | string | 应用 Bundle ID |
| `count` | number | 切换到该应用的次数 |
| `total_seconds` | number | 总使用时长（秒），当前版本为 0 |

---

### API 4: 获取电池事件

获取指定时间范围内的电池/电源相关事件。

**请求**
```
GET /api/battery
GET /api/battery?start=2025-12-19&end=2025-12-20
```

**curl 示例**
```bash
curl http://localhost:8081/api/battery
```

**JavaScript 示例**
```javascript
const response = await fetch('http://localhost:8081/api/battery');
const result = await response.json();

result.data.forEach(event => {
  if (event.event_type === 'power_connected') {
    console.log(`${event.timestamp_str}: 电源已连接，电量 ${event.level}%`);
  } else if (event.event_type === 'power_disconnected') {
    console.log(`${event.timestamp_str}: 电源已断开，电量 ${event.level}%`);
  } else if (event.event_type === 'battery_level_changed') {
    console.log(`${event.timestamp_str}: 电量变化 ${event.level}%`);
  }
});
```

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_type": "power_connected",
      "level": 45,
      "is_charging": true,
      "is_plugged_in": true,
      "timestamp": 1734681234,
      "timestamp_str": "2025-12-20 15:00:34"
    },
    {
      "id": 2,
      "event_type": "battery_level_changed",
      "level": 50,
      "is_charging": true,
      "is_plugged_in": true,
      "timestamp": 1734682000,
      "timestamp_str": "2025-12-20 15:13:20"
    },
    {
      "id": 3,
      "event_type": "power_disconnected",
      "level": 85,
      "is_charging": false,
      "is_plugged_in": false,
      "timestamp": 1734690000,
      "timestamp_str": "2025-12-20 17:26:40"
    }
  ],
  "error": null
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 数据库自增 ID |
| `event_type` | string | 事件类型：`power_connected`、`power_disconnected`、`battery_level_changed` |
| `level` | number | 电池电量百分比（0-100） |
| `is_charging` | boolean | 是否正在充电 |
| `is_plugged_in` | boolean | 是否连接电源 |
| `timestamp` | number | Unix 时间戳（秒） |
| `timestamp_str` | string | 格式化时间字符串 |

---

### API 5: 获取统计概览

获取指定时间范围内的统计数据概览。

**请求**
```
GET /api/stats
GET /api/stats?start=2025-12-19&end=2025-12-20
```

**curl 示例**
```bash
curl http://localhost:8081/api/stats
```

**JavaScript 示例**
```javascript
const response = await fetch('http://localhost:8081/api/stats');
const result = await response.json();

const stats = result.data;
console.log(`总事件数: ${stats.total_events}`);
console.log(`通知数量: ${stats.notification_count}`);
console.log(`应用切换: ${stats.app_switch_count}`);
console.log(`使用应用: ${stats.unique_apps} 个`);
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "total_events": 156,
    "notification_count": 23,
    "app_switch_count": 89,
    "unique_apps": 12,
    "time_range": {
      "start": "2025-12-20 00:00:00",
      "end": "2025-12-20 23:59:59"
    }
  },
  "error": null
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total_events` | number | 总事件数 |
| `notification_count` | number | 通知数量 |
| `app_switch_count` | number | 应用切换次数 |
| `unique_apps` | number | 使用的不同应用数量 |
| `time_range.start` | string | 查询开始时间 |
| `time_range.end` | string | 查询结束时间 |

---

### API 6: 获取应用图标

获取已缓存的应用图标。图标以 Base64 编码的 PNG 格式存储。

**请求**
```
GET /api/icons                              # 获取所有图标
GET /api/icons?bundle_id=com.apple.Safari   # 获取指定应用图标
```

**curl 示例**
```bash
# 获取所有图标
curl http://localhost:8081/api/icons

# 获取指定应用图标
curl "http://localhost:8081/api/icons?bundle_id=com.apple.Safari"
```

**JavaScript 示例**
```javascript
// 获取所有图标
const response = await fetch('http://localhost:8081/api/icons');
const result = await response.json();

// 创建图标映射
const iconMap = {};
result.data.forEach(icon => {
  iconMap[icon.bundle_id] = icon.icon_base64;
});

// 使用图标
function getIconUrl(bundleId) {
  const base64 = iconMap[bundleId];
  return base64 ? `data:image/png;base64,${base64}` : null;
}
```

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "bundle_id": "com.apple.Safari",
      "app_name": "Safari",
      "icon_base64": "iVBORw0KGgoAAAANSUhEUgAAAEAAAABA..."
    },
    {
      "bundle_id": "com.apple.dt.Xcode",
      "app_name": "Xcode",
      "icon_base64": "iVBORw0KGgoAAAANSUhEUgAAAEAAAABA..."
    }
  ],
  "error": null
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `bundle_id` | string | 应用 Bundle ID |
| `app_name` | string \| null | 应用名称 |
| `icon_base64` | string | 图标 Base64 编码（PNG 格式） |

**HTML 中使用图标**
```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABA..." 
     width="32" height="32" alt="App Icon">
```

---

## WebSocket 实时推送

Web 客户端可以通过 WebSocket 连接接收实时事件推送。当 macOS 客户端发送事件到服务器时，服务器会立即将事件广播给所有已连接的 Web 客户端。

### 连接地址

```
ws://localhost:8081/ws
```

### 连接流程

1. 客户端连接到 `ws://localhost:8081/ws`
2. 服务器发送欢迎消息
3. 之后每当有新事件，服务器会推送事件消息
4. 客户端可以发送 ping 消息保持连接

### 消息格式

**欢迎消息**（连接成功后立即收到）
```json
{
  "type": "welcome",
  "message": "Connected to Behavior Monitor - Real-time events"
}
```

**事件消息**（实时推送）
```json
{
  "eventType": "notification_received",
  "timestamp": 1734681234,
  "timestampStr": "2025-12-20 15:00:34",
  "deviceId": "5CA6FC84-B6A0-5A7C-A6B8-985BFCA85455",
  "data": {
    "type": "notification",
    "data": {
      "sourceBundleId": "com.tencent.qq",
      "appName": "QQ",
      "title": "张三",
      "subtitle": null,
      "body": "你好",
      "appIcon": "iVBORw0KGgo..."
    }
  }
}
```

### JavaScript 连接示例

```javascript
class BehaviorMonitorClient {
  constructor(url = 'ws://localhost:8081/ws') {
    this.url = url;
    this.ws = null;
    this.reconnectInterval = 5000;
    this.handlers = {
      notification: [],
      foregroundChange: [],
      battery: [],
      app: [],
      system: [],
      all: []
    };
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('已连接到 Behavior Monitor 服务器');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // 跳过欢迎消息
      if (data.type === 'welcome') {
        console.log(data.message);
        return;
      }

      // 触发 all 处理器
      this.handlers.all.forEach(handler => handler(data));

      // 根据事件类型触发对应处理器
      const eventType = data.data?.type;
      if (eventType && this.handlers[eventType]) {
        this.handlers[eventType].forEach(handler => handler(data));
      }
    };

    this.ws.onclose = () => {
      console.log('连接已断开，5秒后重连...');
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  }

  // 注册事件处理器
  on(eventType, handler) {
    if (this.handlers[eventType]) {
      this.handlers[eventType].push(handler);
    }
    return this;
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const client = new BehaviorMonitorClient();

client
  .on('notification', (event) => {
    const notif = event.data.data;
    console.log(`🔔 ${notif.appName}: ${notif.title} - ${notif.body}`);
  })
  .on('foregroundChange', (event) => {
    const fg = event.data.data;
    console.log(`🔄 切换到: ${fg.toApp}`);
  })
  .on('battery', (event) => {
    const bat = event.data.data;
    console.log(`🔋 电量: ${bat.level}%`);
  })
  .on('all', (event) => {
    console.log('收到事件:', event.eventType);
  });

client.connect();
```

---

## 事件类型详解

### 应用事件

| 事件类型 | 说明 | data.type |
|----------|------|-----------|
| `app_launched` | 应用启动 | `app` |
| `app_terminated` | 应用关闭 | `app` |

**数据结构**
```json
{
  "type": "app",
  "data": {
    "appName": "Safari",
    "bundleId": "com.apple.Safari",
    "isUserInitiated": true,
    "appIcon": "iVBORw0KGgo..."
  }
}
```

### 前台切换事件

| 事件类型 | 说明 | data.type |
|----------|------|-----------|
| `app_foreground_changed` | 前台应用切换 | `foregroundChange` |

**数据结构**
```json
{
  "type": "foregroundChange",
  "data": {
    "fromApp": "Safari",
    "fromBundleId": "com.apple.Safari",
    "toApp": "Xcode",
    "toBundleId": "com.apple.dt.Xcode",
    "triggerSource": "dock_click",
    "toAppIcon": "iVBORw0KGgo..."
  }
}
```

**triggerSource 可能的值**
| 值 | 说明 |
|----|------|
| `dock_click` | 点击 Dock 图标 |
| `cmd_tab` | Cmd+Tab 切换 |
| `mission_control` | 调度中心切换 |
| `spotlight` | Spotlight 启动 |
| `notification_click` | 点击通知 |
| `unknown` | 未知方式 |

### 通知事件

| 事件类型 | 说明 | data.type |
|----------|------|-----------|
| `notification_received` | 收到通知 | `notification` |

**数据结构**
```json
{
  "type": "notification",
  "data": {
    "sourceBundleId": "com.tencent.qq",
    "appName": "QQ",
    "title": "张三",
    "subtitle": "工作群",
    "body": "你好，在吗？",
    "appIcon": "iVBORw0KGgo..."
  }
}
```

### 电池/电源事件

| 事件类型 | 说明 | data.type |
|----------|------|-----------|
| `power_connected` | 电源已连接 | `battery` |
| `power_disconnected` | 电源已断开 | `battery` |
| `battery_level_changed` | 电量变化 | `battery` |

**数据结构**
```json
{
  "type": "battery",
  "data": {
    "level": 85,
    "isCharging": true,
    "isPluggedIn": true
  }
}
```

**电量变化触发规则**
- 电量 ≥ 20%：每变化 5% 触发一次
- 电量 < 20%：每变化 1% 触发一次

### 系统事件

| 事件类型 | 说明 | data.type |
|----------|------|-----------|
| `system_sleep` | 系统睡眠 | `empty` |
| `system_wake` | 系统唤醒 | `empty` |
| `system_boot` | 系统/应用启动 | `empty` |
| `system_shutdown` | 系统关机 | `empty` |

**数据结构**
```json
{
  "type": "empty",
  "data": {}
}
```

---

## 数据结构定义

### TypeScript 类型定义

```typescript
// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// 事件记录
interface EventRecord {
  id: number;
  event_id: string;
  event_type: string;
  timestamp: number;
  timestamp_str: string;
  device_id: string;
  data: EventDataWrapper;
}

// 事件数据包装器
type EventDataWrapper = 
  | { type: 'app'; data: AppEventData }
  | { type: 'foregroundChange'; data: ForegroundChangeData }
  | { type: 'notification'; data: NotificationEventData }
  | { type: 'battery'; data: BatteryEventData }
  | { type: 'empty'; data: {} };

// 应用事件数据
interface AppEventData {
  appName: string;
  bundleId: string;
  isUserInitiated: boolean;
  appIcon?: string;
}

// 前台切换数据
interface ForegroundChangeData {
  fromApp?: string;
  fromBundleId?: string;
  toApp: string;
  toBundleId: string;
  triggerSource: string;
  toAppIcon?: string;
}

// 通知数据
interface NotificationEventData {
  sourceBundleId: string;
  appName?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  appIcon?: string;
}

// 电池数据
interface BatteryEventData {
  level: number;
  isCharging: boolean;
  isPluggedIn: boolean;
}

// 通知记录
interface NotificationRecord {
  id: number;
  source_bundle_id: string;
  app_name: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  app_icon: string | null;
  timestamp: number;
  timestamp_str: string;
}

// 应用使用统计
interface AppUsageRecord {
  app_name: string;
  bundle_id: string;
  count: number;
  total_seconds: number;
}

// 电池记录
interface BatteryRecord {
  id: number;
  event_type: string;
  level: number;
  is_charging: boolean;
  is_plugged_in: boolean;
  timestamp: number;
  timestamp_str: string;
}

// 统计概览
interface StatsData {
  total_events: number;
  notification_count: number;
  app_switch_count: number;
  unique_apps: number;
  time_range: {
    start: string;
    end: string;
  };
}

// 应用图标
interface AppIconRecord {
  bundle_id: string;
  app_name: string | null;
  icon_base64: string;
}

// WebSocket 广播事件
interface BroadcastEvent {
  eventType: string;
  timestamp: number;
  timestampStr: string;
  deviceId: string;
  data: EventDataWrapper;
}
```

---

## 数据库结构

数据存储在 `behavior_events.db` SQLite 文件中。

### 表结构

#### events（主事件表）
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,      -- 事件 UUID
    event_type TEXT NOT NULL,           -- 事件类型
    timestamp INTEGER NOT NULL,         -- Unix 时间戳
    device_id TEXT NOT NULL,            -- 设备 ID
    data_json TEXT NOT NULL,            -- 事件数据 JSON
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### app_events（应用启动/关闭）
```sql
CREATE TABLE app_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    bundle_id TEXT NOT NULL,
    is_user_initiated INTEGER NOT NULL,
    app_icon TEXT,                      -- Base64 图标
    timestamp INTEGER NOT NULL
);
```

#### foreground_events（前台切换）
```sql
CREATE TABLE foreground_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    from_app TEXT,
    from_bundle_id TEXT,
    to_app TEXT NOT NULL,
    to_bundle_id TEXT NOT NULL,
    to_app_icon TEXT,                   -- Base64 图标
    trigger_source TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);
```

#### notifications（通知）
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    source_bundle_id TEXT NOT NULL,
    app_name TEXT,
    title TEXT,
    subtitle TEXT,
    body TEXT,
    app_icon TEXT,                      -- Base64 图标
    timestamp INTEGER NOT NULL
);
```

#### battery_events（电池事件）
```sql
CREATE TABLE battery_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,           -- power_connected/power_disconnected/battery_level_changed
    level INTEGER NOT NULL,             -- 电量百分比
    is_charging INTEGER NOT NULL,       -- 0 或 1
    is_plugged_in INTEGER NOT NULL,     -- 0 或 1
    timestamp INTEGER NOT NULL
);
```

#### system_events（系统事件）
```sql
CREATE TABLE system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,           -- system_sleep/system_wake/system_boot/system_shutdown
    timestamp INTEGER NOT NULL
);
```

#### app_icons（图标缓存）
```sql
CREATE TABLE app_icons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bundle_id TEXT NOT NULL UNIQUE,
    app_name TEXT,
    icon_base64 TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 直接查询示例

```bash
# 打开数据库
sqlite3 behavior_events.db

# 查看今天的通知
SELECT app_name, title, body, datetime(timestamp, 'unixepoch', 'localtime') as time
FROM notifications 
WHERE date(timestamp, 'unixepoch', 'localtime') = date('now')
ORDER BY timestamp DESC;

# 查看应用使用排行
SELECT to_app, COUNT(*) as count 
FROM foreground_events 
WHERE date(timestamp, 'unixepoch', 'localtime') = date('now')
GROUP BY to_app 
ORDER BY count DESC 
LIMIT 10;

# 查看电池事件
SELECT event_type, level, is_charging, datetime(timestamp, 'unixepoch', 'localtime') as time
FROM battery_events
WHERE date(timestamp, 'unixepoch', 'localtime') = date('now')
ORDER BY timestamp DESC;

# 查看所有事件类型统计
SELECT event_type, COUNT(*) as count
FROM events
WHERE date(timestamp, 'unixepoch', 'localtime') = date('now')
GROUP BY event_type
ORDER BY count DESC;

# 导出今天的通知为 JSON
.mode json
SELECT * FROM notifications 
WHERE date(timestamp, 'unixepoch', 'localtime') = date('now');
```

---
