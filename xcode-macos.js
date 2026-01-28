/* ═══════════════════════════════════════════════════════════════
   🍎 XCODE macOS THEME v2.0 - 动态效果增强版
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══ 注入增强样式 ═══
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'xcode-macos-enhanced';
    style.textContent = `
      /* 图片悬停效果 */
      .mac-img-hover {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      
      .mac-img-hover:hover {
        transform: scale(1.02);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12) !important;
      }
      
      /* 按钮波纹效果 */
      .mac-ripple {
        position: relative;
        overflow: hidden;
      }
      
      .mac-ripple::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.4s ease, height 0.4s ease, opacity 0.4s ease;
        opacity: 0;
      }
      
      .mac-ripple:active::after {
        width: 200px;
        height: 200px;
        opacity: 1;
        transition: 0s;
      }
      
      /* 输入框聚焦光晕 */
      .mac-input-glow:focus {
        box-shadow: 
          0 0 0 4px rgba(0, 122, 255, 0.15),
          0 4px 12px rgba(0, 0, 0, 0.05) !important;
      }
      
      /* 滚动进度条 */
      .mac-scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        background: linear-gradient(90deg, #007AFF, #5856D6);
        z-index: 9999;
        transition: width 0.1s ease;
      }
    `;
    document.head.appendChild(style);
  }

  // ═══ 代码块增强 ═══
  function enhanceCodeBlocks() {
    // 不再添加额外的窗口栏，直接美化原有的 md-editor-code-head
    document.querySelectorAll('.md-editor-code:not(.mac-enhanced)').forEach(block => {
      block.classList.add('mac-enhanced');
    });
    
    // 移除之前可能添加的重复窗口栏
    document.querySelectorAll('.mac-window-bar').forEach(bar => bar.remove());
  }

  // ═══ 卡片动画 ═══
  function animateCards() {
    document.querySelectorAll('.will-change-transform:not(.mac-observed)').forEach(card => {
      card.classList.add('mac-observed');
    });
  }

  // ═══ 图片效果 ═══
  function enhanceImages() {
    document.querySelectorAll('.md-editor-preview img:not(.mac-img-enhanced), [class*="gallery"] img:not(.mac-img-enhanced)').forEach(img => {
      img.classList.add('mac-img-enhanced', 'mac-img-hover');
    });
  }

  // ═══ 按钮效果 ═══
  function enhanceButtons() {
    document.querySelectorAll('button[type="submit"]:not(.mac-btn-enhanced), .btn:not(.mac-btn-enhanced)').forEach(btn => {
      btn.classList.add('mac-btn-enhanced', 'mac-ripple');
    });
  }

  // ═══ 输入框效果 ═══
  function enhanceInputs() {
    document.querySelectorAll('input:not(.mac-input-enhanced), textarea:not(.mac-input-enhanced)').forEach(input => {
      input.classList.add('mac-input-enhanced', 'mac-input-glow');
    });
  }

  // ═══ 滚动进度条 ═══
  function initScrollProgress() {
    const progress = document.createElement('div');
    progress.className = 'mac-scroll-progress';
    document.body.appendChild(progress);

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progress.style.width = `${scrollPercent}%`;
    });
  }

  // ═══ 平滑滚动 ═══
  function initSmoothScroll() {
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  // ═══ DOM 监听 ═══
  function observeDOM() {
    const observer = new MutationObserver(() => {
      enhanceCodeBlocks();
      animateCards();
      enhanceImages();
      enhanceButtons();
      enhanceInputs();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ═══ 初始化 ═══
  function init() {
    console.log('%c🍎 Xcode macOS Theme v2.0', 
      'background: linear-gradient(135deg, #007AFF, #5E5CE6); color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600;');
    
    injectStyles();
    initSmoothScroll();
    initScrollProgress();
    enhanceCodeBlocks();
    animateCards();
    enhanceImages();
    enhanceButtons();
    enhanceInputs();
    observeDOM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
