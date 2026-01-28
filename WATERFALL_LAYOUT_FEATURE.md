# 瀑布流布局功能说明

## 功能概述

为动态列表添加了瀑布流布局支持，类似小红书的展示方式。用户可以在列表视图和瀑布流视图之间自由切换。

## 实现的功能

### 1. 布局模式
- **瀑布流布局**（默认）：动态卡片以瀑布流形式展示，自动适应内容高度
- **列表布局**：传统的垂直列表展示方式

### 2. 切换按钮
- 位置：在首页顶部导航栏的右侧，RSS 图标左边
- 图标：
  - 当前为列表模式时，显示瀑布流图标
  - 当前为瀑布流模式时，显示列表图标
- 交互：点击按钮即可切换布局模式

### 3. 状态持久化
- 用户选择的布局模式会自动保存到 localStorage
- 刷新页面后会保持用户上次选择的布局模式

### 4. 响应式设计
- 移动端（小于 640px）：单列瀑布流
- 桌面端（大于等于 640px）：双列瀑布流

## 修改的文件

### 新增文件
1. `web/src/components/icons/waterfallview.vue` - 瀑布流视图图标
2. `web/src/components/icons/listview.vue` - 列表视图图标

### 修改文件
1. `web/src/stores/echo.ts`
   - 添加 `listLayoutMode` 状态（默认为 'waterfall'）
   - 添加 localStorage 持久化逻辑

2. `web/src/views/home/modules/TheTop.vue`
   - 添加布局切换按钮
   - 导入新的图标组件
   - 添加 `toggleLayout` 方法

3. `web/src/views/home/modules/TheEchos.vue`
   - 添加瀑布流布局的 HTML 结构
   - 添加瀑布流布局的 CSS 样式
   - 根据 `listLayoutMode` 条件渲染不同布局

4. `web/src/views/home/modules/TheFilteredEchos.vue`
   - 同样添加瀑布流布局支持
   - 确保过滤后的动态列表也支持布局切换

## 使用方法

1. 启动项目后，访问首页
2. 默认显示瀑布流布局
3. 点击顶部导航栏右侧的布局切换按钮
4. 布局会在列表和瀑布流之间切换
5. 刷新页面后会保持上次选择的布局

## 技术实现

### CSS 瀑布流
使用 CSS 的 `column-count` 属性实现瀑布流效果：
- 移动端：`column-count: 1`
- 桌面端：`column-count: 2`
- 配合 `break-inside: avoid` 防止卡片被截断

### 状态管理
- 使用 Pinia store 管理布局状态
- 使用 `localStg` 工具进行 localStorage 操作
- 使用 Vue 的 `watch` 监听状态变化并自动保存

### 动画效果
- 保留原有的入场动画
- 布局切换时平滑过渡

## 注意事项

1. 瀑布流布局使用 CSS columns，在某些浏览器中可能有兼容性问题
2. 如果需要更复杂的瀑布流效果（如等高列），可以考虑使用 JavaScript 库如 Masonry.js
3. 当前实现为双列瀑布流，如需更多列可以修改 CSS 的 `column-count` 值
