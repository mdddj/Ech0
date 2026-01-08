/* ═══════════════════════════════════════════════════════════════
   🍎 XCODE macOS THEME - 动态效果
   macOS 风格交互和窗口效果
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══ 配置 ═══
  const CONFIG = {
    enableWindowButtons: true,    // 窗口控制按钮
    enableHoverEffects: true,     // 悬停效果
    enableSmoothScroll: true,     // 平滑滚动
    enableCodeBlockEnhance: true, // 代码块增强
  };

  // ═══ 注入样式 ═══
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'xcode-macos-js-styles';
    style.textContent = `
      /* macOS 窗口控制按钮 */
      .mac-window-buttons {
        display: flex;
        gap: 8px;
        padding: 12px 14px;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10;
      }
      
      .mac-window-btn {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: none;
        cursor: default;
        transition: all 0.15s ease;
      }
      
      .mac-window-btn.close { background: #FF5F57; }
      .mac-window-btn.minimize { background: #FEBC2E; }
      .mac-window-btn.maximize { background: #28C840; }
      
      /* 悬停时显示图标 */
      .mac-window-buttons:hover .mac-window-btn.close::after {
        content: '×';
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: rgba(0,0,0,0.5);
        line-height: 12px;
      }
      
      .mac-window-buttons:hover .mac-window-btn.minimize::after {
        content: '−';
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: rgba(0,0,0,0.5);
        line-height: 12px;
      }
      
      .mac-window-buttons:hover .mac-window-btn.maximize::after {
        content: '+';
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: rgba(0,0,0,0.5);
        line-height: 12px;
      }
      
      /* 代码块窗口样式 */
      .mac-code-window {
        position: relative;
        padding-top: 36px !important;
      }
      
      .mac-code-window .mac-window-buttons {
        background: linear-gradient(180deg, 
          rgba(255,255,255,0.1) 0%, 
          transparent 100%
        );
        width: 100%;
        border-radius: 10px 10px 0 0;
        border-bottom: 1px solid var(--mac-divider, rgba(0,0,0,0.06));
      }
      
      /* 代码块标题 */
      .mac-code-title {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: var(--mac-text-secondary, #86868B);
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      /* 卡片悬停效果 */
      .mac-card-hover {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .mac-card-hover:hover {
        transform: translateY(-2px);
      }
      
      /* 按钮点击效果 */
      .mac-btn-press:active {
        transform: scale(0.97);
      }
      
      /* 输入框聚焦动画 */
      .mac-input-focus {
        transition: box-shadow 0.2s ease, border-color 0.2s ease;
      }
      
      /* 图片加载动画 */
      .mac-img-loading {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .mac-img-loaded {
        opacity: 1;
      }
      
      /* 暗色模式下的窗口按钮 */
      html.dark .mac-window-buttons:hover .mac-window-btn::after,
      [data-theme="dark"] .mac-window-buttons:hover .mac-window-btn::after {
        color: rgba(0,0,0,0.6);
      }
    `;
    document.head.appendChild(style);
  }

  // ═══ 为代码块添加 macOS 窗口按钮 ═══
  function enhanceCodeBlocks() {
    if (!CONFIG.enableCodeBlockEnhance) return;

    const codeBlocks = document.querySelectorAll('pre:not(.mac-enhanced)');
    
    codeBlocks.forEach(pre => {
      pre.classList.add('mac-enhanced', 'mac-code-window');
      
      // 创建窗口按钮
      const buttons = document.createElement('div');
      buttons.className = 'mac-window-buttons';
      buttons.innerHTML = `
        <span class="mac-window-btn close"></span>
        <span class="mac-window-btn minimize"></span>
        <span class="mac-window-btn maximize"></span>
      `;
      
      // 获取语言标识
      const code = pre.querySelector('code');
      const langClass = code?.className.match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : '';
      
      if (lang) {
        const title = document.createElement('span');
        title.className = 'mac-code-title';
        title.textContent = lang;
        buttons.appendChild(title);
      }
      
      pre.insertBefore(buttons, pre.firstChild);
    });
  }

  // ═══ 添加卡片悬停效果 ═══
  function addHoverEffects() {
    if (!CONFIG.enableHoverEffects) return;

    const cards = document.querySelectorAll('.will-change-transform:not(.mac-hover-added)');
    cards.forEach(card => {
      card.classList.add('mac-hover-added', 'mac-card-hover');
    });

    const buttons = document.querySelectorAll('button:not(.mac-btn-added)');
    buttons.forEach(btn => {
      btn.classList.add('mac-btn-added', 'mac-btn-press');
    });
  }

  // ═══ 平滑滚动 ═══
  function initSmoothScroll() {
    if (!CONFIG.enableSmoothScroll) return;
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  // ═══ 图片加载动画 ═══
  function initImageLoading() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const images = node.querySelectorAll?.('img:not(.mac-img-observed)') || [];
            images.forEach(img => {
              img.classList.add('mac-img-observed', 'mac-img-loading');
              if (img.complete) {
                img.classList.add('mac-img-loaded');
              } else {
                img.addEventListener('load', () => {
                  img.classList.add('mac-img-loaded');
                });
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // 处理已存在的图片
    document.querySelectorAll('img:not(.mac-img-observed)').forEach(img => {
      img.classList.add('mac-img-observed', 'mac-img-loading');
      if (img.complete) {
        img.classList.add('mac-img-loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('mac-img-loaded');
        });
      }
    });
  }

  // ═══ 监听 DOM 变化 ═══
  function observeDOM() {
    const observer = new MutationObserver(() => {
      enhanceCodeBlocks();
      addHoverEffects();
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }

  // ═══ 初始化 ═══
  function init() {
    console.log('%c🍎 Xcode macOS Theme Loaded', 
      'color: #007AFF; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif;');
    
    injectStyles();
    initSmoothScroll();
    initImageLoading();
    enhanceCodeBlocks();
    addHoverEffects();
    observeDOM();
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
