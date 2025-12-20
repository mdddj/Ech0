/* ═══════════════════════════════════════════════════════════════
   👁️ 赛博监工 - CYBER MONITOR WIDGET
   实时监控 macOS 行为事件
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ═══ 配置 ═══
  const CONFIG = {
    serverIP: '202.140.142.250',
    httpPort: 9081,
    wsPort: 9081,
    maxEvents: 20,           // 最多显示事件数
    reconnectInterval: 5000, // 重连间隔 (ms)
  };

  const API_BASE = `http://${CONFIG.serverIP}:${CONFIG.httpPort}`;
  const WS_URL = `ws://${CONFIG.serverIP}:${CONFIG.wsPort}/ws`;

  let ws = null;
  let events = [];
  let stats = null;
  let widgetContainer = null;
  let isConnected = false;

  // ═══ 事件图标映射 ═══
  const EVENT_ICONS = {
    app_launched: '🚀',
    app_terminated: '💤',
    app_foreground_changed: '🔄',
    notification_received: '🔔',
    power_connected: '🔌',
    power_disconnected: '🔋',
    battery_level_changed: '⚡',
    system_sleep: '😴',
    system_wake: '☀️',
    system_boot: '🖥️',
    system_shutdown: '⏹️',
  };

  // ═══ 事件类型中文名 ═══
  const EVENT_NAMES = {
    app_launched: '启动应用',
    app_terminated: '关闭应用',
    app_foreground_changed: '切换应用',
    notification_received: '收到通知',
    power_connected: '接入电源',
    power_disconnected: '断开电源',
    battery_level_changed: '电量变化',
    system_sleep: '系统睡眠',
    system_wake: '系统唤醒',
    system_boot: '系统启动',
    system_shutdown: '系统关机',
  };

  // ═══ 注入样式 ═══
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'cyber-monitor-styles';
    style.textContent = `
      #cyber-monitor-widget {
        font-family: 'Share Tech Mono', 'VT323', monospace;
        background: var(--cf-bg-card, #1a1a24);
        border: 1px solid var(--cf-cyan, #00ffff);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
      }

      #cyber-monitor-widget::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff);
        animation: cyberGradient 3s linear infinite;
      }

      @keyframes cyberGradient {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }

      .cyber-monitor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(0, 255, 255, 0.3);
      }

      .cyber-monitor-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--cf-cyan, #00ffff);
        font-size: 16px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .cyber-monitor-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .cyber-monitor-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      .cyber-monitor-dot.connected {
        background: #00ff41;
        box-shadow: 0 0 10px #00ff41;
      }

      .cyber-monitor-dot.disconnected {
        background: #ff4141;
        box-shadow: 0 0 10px #ff4141;
        animation: none;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }

      .cyber-monitor-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }

      .cyber-stat-item {
        text-align: center;
        padding: 4px;
      }

      .cyber-stat-value {
        font-size: 20px;
        font-weight: bold;
        color: var(--cf-amber, #ffb000);
        text-shadow: 0 0 10px rgba(255, 176, 0, 0.5);
      }

      .cyber-stat-label {
        font-size: 10px;
        color: var(--cf-text-secondary, #888);
        text-transform: uppercase;
      }

      .cyber-monitor-events {
        max-height: 300px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--cf-cyan, #00ffff) transparent;
      }

      .cyber-monitor-events::-webkit-scrollbar {
        width: 4px;
      }

      .cyber-monitor-events::-webkit-scrollbar-thumb {
        background: var(--cf-cyan, #00ffff);
        border-radius: 2px;
      }

      .cyber-event-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px;
        margin-bottom: 6px;
        background: rgba(0, 255, 255, 0.05);
        border-left: 2px solid var(--cf-cyan, #00ffff);
        border-radius: 0 4px 4px 0;
        transition: all 0.3s ease;
        animation: slideIn 0.3s ease-out;
      }

      .cyber-event-item:hover {
        background: rgba(0, 255, 255, 0.1);
        transform: translateX(4px);
      }

      .cyber-event-item.new {
        animation: newEvent 0.5s ease-out;
        border-left-color: #00ff41;
        background: rgba(0, 255, 65, 0.1);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes newEvent {
        0% {
          opacity: 0;
          transform: translateX(-30px) scale(0.9);
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.8);
        }
        50% {
          box-shadow: 0 0 30px rgba(0, 255, 65, 0.6);
        }
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
          box-shadow: none;
        }
      }

      .cyber-event-icon {
        font-size: 20px;
        min-width: 28px;
        text-align: center;
      }

      .cyber-event-content {
        flex: 1;
        min-width: 0;
      }

      .cyber-event-type {
        font-size: 12px;
        color: var(--cf-cyan, #00ffff);
        font-weight: bold;
      }

      .cyber-event-detail {
        font-size: 11px;
        color: var(--cf-text-primary, #e0e0e0);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cyber-event-time {
        font-size: 10px;
        color: var(--cf-text-secondary, #888);
        white-space: nowrap;
      }

      .cyber-event-app-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        object-fit: cover;
      }

      .cyber-monitor-empty {
        text-align: center;
        padding: 20px;
        color: var(--cf-text-secondary, #888);
        font-style: italic;
      }

      .cyber-monitor-error {
        text-align: center;
        padding: 12px;
        color: #ff6b6b;
        background: rgba(255, 107, 107, 0.1);
        border-radius: 4px;
        font-size: 12px;
      }

      /* 亮色模式 */
      html.light #cyber-monitor-widget,
      [data-theme="light"] #cyber-monitor-widget {
        background: var(--cf-bg-card, #faf8f3);
        border-color: var(--cf-cyan, #006666);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      }

      html.light .cyber-monitor-title,
      [data-theme="light"] .cyber-monitor-title {
        color: var(--cf-cyan, #006666);
      }

      html.light .cyber-stat-value,
      [data-theme="light"] .cyber-stat-value {
        text-shadow: none;
      }

      html.light .cyber-event-item,
      [data-theme="light"] .cyber-event-item {
        background: rgba(0, 102, 102, 0.05);
        border-left-color: var(--cf-cyan, #006666);
      }
    `;
    document.head.appendChild(style);
  }

  // ═══ 创建 Widget ═══
  function createWidget() {
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'cyber-monitor-widget';
    widgetContainer.innerHTML = `
      <div class="cyber-monitor-header">
        <div class="cyber-monitor-title">
          <span>👁️</span>
          <span>赛博监工</span>
        </div>
        <div class="cyber-monitor-status">
          <div class="cyber-monitor-dot disconnected" id="cyber-status-dot"></div>
          <span id="cyber-status-text">连接中...</span>
        </div>
      </div>
      <div class="cyber-monitor-stats" id="cyber-stats">
        <div class="cyber-stat-item">
          <div class="cyber-stat-value" id="stat-total">-</div>
          <div class="cyber-stat-label">总事件</div>
        </div>
        <div class="cyber-stat-item">
          <div class="cyber-stat-value" id="stat-apps">-</div>
          <div class="cyber-stat-label">应用数</div>
        </div>
        <div class="cyber-stat-item">
          <div class="cyber-stat-value" id="stat-notifs">-</div>
          <div class="cyber-stat-label">通知</div>
        </div>
        <div class="cyber-stat-item">
          <div class="cyber-stat-value" id="stat-switches">-</div>
          <div class="cyber-stat-label">切换</div>
        </div>
      </div>
      <div class="cyber-monitor-events" id="cyber-events">
        <div class="cyber-monitor-empty">加载中...</div>
      </div>
    `;

    // 找到合适的插入位置
    const sidebar = document.querySelector('.xl\\:block.sm\\:max-w-sm');
    if (sidebar) {
      // 插入到侧边栏第一个位置
      sidebar.insertBefore(widgetContainer, sidebar.firstChild);
    } else {
      // 备选：插入到主内容区域
      const mainContent = document.querySelector('main') || document.body;
      mainContent.insertBefore(widgetContainer, mainContent.firstChild);
    }
  }

  // ═══ 更新连接状态 ═══
  function updateConnectionStatus(connected, message) {
    isConnected = connected;
    const dot = document.getElementById('cyber-status-dot');
    const text = document.getElementById('cyber-status-text');
    if (dot && text) {
      dot.className = `cyber-monitor-dot ${connected ? 'connected' : 'disconnected'}`;
      text.textContent = message || (connected ? '已连接' : '未连接');
    }
  }

  // ═══ 更新统计数据 ═══
  function updateStats(data) {
    stats = data;
    const elements = {
      'stat-total': data.total_events,
      'stat-apps': data.unique_apps,
      'stat-notifs': data.notification_count,
      'stat-switches': data.app_switch_count,
    };
    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? '-';
    });
  }

  // ═══ 格式化事件详情 ═══
  function formatEventDetail(event) {
    const data = event.data?.data || {};
    const type = event.data?.type || event.event_type;

    switch (type) {
      case 'foregroundChange':
        return `${data.fromApp || '?'} → ${data.toApp || '?'}`;
      case 'notification':
        return `${data.appName || '未知'}: ${data.title || ''} ${data.body || ''}`.trim();
      case 'app':
        return data.appName || '未知应用';
      case 'battery':
        return `电量 ${data.level}% ${data.isCharging ? '⚡充电中' : ''}`;
      default:
        return EVENT_NAMES[event.event_type] || event.event_type;
    }
  }

  // ═══ 获取应用图标 ═══
  function getAppIcon(event) {
    const data = event.data?.data || {};
    const icon = data.toAppIcon || data.appIcon || data.app_icon;
    if (icon) {
      return `<img class="cyber-event-app-icon" src="data:image/png;base64,${icon}" alt="icon">`;
    }
    return '';
  }

  // ═══ 渲染事件列表 ═══
  function renderEvents(isNew = false) {
    const container = document.getElementById('cyber-events');
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = '<div class="cyber-monitor-empty">今日暂无事件 📭</div>';
      return;
    }

    container.innerHTML = events
      .slice(0, CONFIG.maxEvents)
      .map(
        (event, index) => `
      <div class="cyber-event-item ${index === 0 && isNew ? 'new' : ''}">
        <div class="cyber-event-icon">${EVENT_ICONS[event.event_type] || '📌'}</div>
        ${getAppIcon(event)}
        <div class="cyber-event-content">
          <div class="cyber-event-type">${EVENT_NAMES[event.event_type] || event.event_type}</div>
          <div class="cyber-event-detail" title="${formatEventDetail(event)}">${formatEventDetail(event)}</div>
        </div>
        <div class="cyber-event-time">${event.timestamp_str?.split(' ')[1] || ''}</div>
      </div>
    `
      )
      .join('');
  }

  // ═══ 加载今日数据 ═══
  async function loadTodayData() {
    try {
      // 获取统计数据
      const statsRes = await fetch(`${API_BASE}/api/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        updateStats(statsData.data);
      }

      // 获取今日事件
      const eventsRes = await fetch(`${API_BASE}/api/events`);
      const eventsData = await eventsRes.json();
      if (eventsData.success && eventsData.data) {
        events = eventsData.data.reverse(); // 最新的在前
        renderEvents();
      }

      updateConnectionStatus(true, '数据已加载');
    } catch (error) {
      console.error('加载数据失败:', error);
      updateConnectionStatus(false, '加载失败');
      const container = document.getElementById('cyber-events');
      if (container) {
        container.innerHTML = `<div class="cyber-monitor-error">⚠️ 无法连接服务器<br><small>${error.message}</small></div>`;
      }
    }
  }

  // ═══ WebSocket 连接 ═══
  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('🔗 赛博监工 WebSocket 已连接');
        updateConnectionStatus(true, '实时监控中');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 跳过欢迎消息
          if (data.type === 'welcome') {
            console.log('👁️', data.message);
            return;
          }

          // 转换为统一格式
          const newEvent = {
            event_type: data.eventType,
            timestamp: data.timestamp,
            timestamp_str: data.timestampStr,
            data: data.data,
          };

          // 入栈新事件
          events.unshift(newEvent);
          if (events.length > CONFIG.maxEvents * 2) {
            events = events.slice(0, CONFIG.maxEvents * 2);
          }

          // 更新统计
          if (stats) {
            stats.total_events++;
            if (data.eventType === 'notification_received') stats.notification_count++;
            if (data.eventType === 'app_foreground_changed') stats.app_switch_count++;
            updateStats(stats);
          }

          // 渲染（带动画）
          renderEvents(true);
        } catch (e) {
          console.error('解析 WebSocket 消息失败:', e);
        }
      };

      ws.onclose = () => {
        console.log('🔌 赛博监工 WebSocket 已断开，5秒后重连...');
        updateConnectionStatus(false, '已断开');
        setTimeout(connectWebSocket, CONFIG.reconnectInterval);
      };

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        updateConnectionStatus(false, '连接错误');
      };
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      updateConnectionStatus(false, '连接失败');
      setTimeout(connectWebSocket, CONFIG.reconnectInterval);
    }
  }

  // ═══ 初始化 ═══
  function init() {
    console.log('%c👁️ 赛博监工已启动', 'color: #00ffff; font-size: 14px; font-weight: bold;');

    injectStyles();
    createWidget();
    loadTodayData();
    connectWebSocket();
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // 延迟一点确保页面结构加载完成
    setTimeout(init, 500);
  }
})();
