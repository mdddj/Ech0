/* ═══════════════════════════════════════════════════════════════
   📝 MINIMAL NOTES THEME - 简约笔记动态效果
   轻量、无干扰、专注内容
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══ 配置 ═══
  const CONFIG = {
    enableSmoothScroll: true,     // 平滑滚动
    enableReadingProgress: true,  // 阅读进度条
    enableFocusMode: false,       // 专注模式（可手动开启）
  };

  // ═══ 平滑滚动 ═══
  function initSmoothScroll() {
    if (!CONFIG.enableSmoothScroll) return;
    
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  // ═══ 阅读进度条 ═══
  function initReadingProgress() {
    if (!CONFIG.enableReadingProgress) return;
    
    const progressBar = document.createElement('div');
    progressBar.id = 'mn-reading-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 2px;
      background: linear-gradient(90deg, #e07a5f, #e07a5f);
      z-index: 99999;
      transition: width 0.1s ease-out;
      border-radius: 0 1px 1px 0;
    `;
    document.body.appendChild(progressBar);

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ═══ 专注模式 ═══
  function initFocusMode() {
    // 创建专注模式切换按钮
    const focusBtn = document.createElement('button');
    focusBtn.id = 'mn-focus-toggle';
    focusBtn.innerHTML = '📖';
    focusBtn.title = '专注模式';
    focusBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--mn-border, #e8e8e8);
      background: var(--mn-bg-card, #ffffff);
      color: var(--mn-text, #2c2c2c);
      font-size: 18px;
      cursor: pointer;
      z-index: 99998;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
    `;
    
    focusBtn.addEventListener('mouseenter', () => {
      focusBtn.style.opacity = '1';
      focusBtn.style.transform = 'scale(1.05)';
    });
    
    focusBtn.addEventListener('mouseleave', () => {
      focusBtn.style.opacity = '0.7';
      focusBtn.style.transform = 'scale(1)';
    });
    
    let isFocusMode = false;
    
    focusBtn.addEventListener('click', () => {
      isFocusMode = !isFocusMode;
      document.body.classList.toggle('mn-focus-mode', isFocusMode);
      focusBtn.innerHTML = isFocusMode ? '👁️' : '📖';
      focusBtn.title = isFocusMode ? '退出专注模式' : '专注模式';
      
      // 添加专注模式样式
      if (isFocusMode) {
        injectFocusModeStyles();
      } else {
        removeFocusModeStyles();
      }
    });
    
    document.body.appendChild(focusBtn);
  }

  function injectFocusModeStyles() {
    if (document.getElementById('mn-focus-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mn-focus-styles';
    style.textContent = `
      .mn-focus-mode nav,
      .mn-focus-mode header,
      .mn-focus-mode [class*="TheTop"],
      .mn-focus-mode .xl\\:block.sm\\:max-w-sm {
        opacity: 0.3;
        transition: opacity 0.3s ease;
      }
      
      .mn-focus-mode nav:hover,
      .mn-focus-mode header:hover,
      .mn-focus-mode [class*="TheTop"]:hover,
      .mn-focus-mode .xl\\:block.sm\\:max-w-sm:hover {
        opacity: 1;
      }
      
      .mn-focus-mode .will-change-transform {
        max-width: 680px;
        margin-left: auto;
        margin-right: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function removeFocusModeStyles() {
    const style = document.getElementById('mn-focus-styles');
    if (style) style.remove();
  }

  // ═══ 图片懒加载淡入效果 ═══
  function initImageFadeIn() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // 监听新图片
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const images = node.querySelectorAll?.('img') || [];
            images.forEach(img => {
              if (!img.dataset.mnObserved) {
                img.dataset.mnObserved = 'true';
                img.style.opacity = '0';
                img.style.transform = 'translateY(10px)';
                img.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                observer.observe(img);
              }
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ═══ 初始化 ═══
  function init() {
    console.log('%c📝 Minimal Notes Theme Loaded', 
      'color: #e07a5f; font-size: 12px; font-weight: 500;');
    
    initSmoothScroll();
    initReadingProgress();
    initFocusMode();
    initImageFadeIn();
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
