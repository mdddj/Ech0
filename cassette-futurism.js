/* ═══════════════════════════════════════════════════════════════
   🎛️ CASSETTE FUTURISM - 动态效果脚本
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══ 配置 ═══
  const CONFIG = {
    enableScanlines: true,      // 扫描线效果
    enableFlicker: true,        // 屏幕闪烁
    enableTypewriter: true,     // 打字机效果
    enableGlitch: true,         // 故障效果
    enableBootSequence: true,  // 启动序列 (首次加载)
    enableAmbientSound: true,  // 环境音效 (需用户交互)
  };

  // ═══ 工具函数 ═══
  const random = (min, max) => Math.random() * (max - min) + min;
  const randomInt = (min, max) => Math.floor(random(min, max));

  // ═══ CRT 屏幕闪烁效果 ═══
  function initFlicker() {
    if (!CONFIG.enableFlicker) return;
    
    const flickerOverlay = document.createElement('div');
    flickerOverlay.id = 'cf-flicker-overlay';
    flickerOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9997;
      background: transparent;
      opacity: 0;
      transition: opacity 0.05s;
    `;
    document.body.appendChild(flickerOverlay);

    // 随机闪烁
    setInterval(() => {
      if (Math.random() > 0.97) {
        flickerOverlay.style.opacity = random(0.02, 0.08);
        flickerOverlay.style.background = 'rgba(255, 176, 0, 0.03)';
        setTimeout(() => {
          flickerOverlay.style.opacity = '0';
        }, randomInt(50, 150));
      }
    }, 100);
  }

  // ═══ 故障效果 ═══
  function initGlitch() {
    if (!CONFIG.enableGlitch) return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes cf-glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      
      @keyframes cf-glitch-skew {
        0% { transform: skew(0deg); }
        20% { transform: skew(2deg); }
        40% { transform: skew(-1deg); }
        60% { transform: skew(1deg); }
        80% { transform: skew(-2deg); }
        100% { transform: skew(0deg); }
      }
      
      .cf-glitch-active {
        animation: cf-glitch 0.3s ease-in-out;
      }
      
      .cf-glitch-text::before,
      .cf-glitch-text::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      .cf-glitch-text::before {
        color: #ff00ff;
        animation: cf-glitch 0.3s ease-in-out infinite;
        clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        transform: translate(-2px, -2px);
        opacity: 0.8;
      }
      
      .cf-glitch-text::after {
        color: #00ffff;
        animation: cf-glitch 0.3s ease-in-out infinite reverse;
        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
        transform: translate(2px, 2px);
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);

    // 随机触发故障效果
    setInterval(() => {
      if (Math.random() > 0.95) {
        document.body.classList.add('cf-glitch-active');
        setTimeout(() => {
          document.body.classList.remove('cf-glitch-active');
        }, 300);
      }
    }, 3000);
  }

  // ═══ 打字机效果 ═══
  function initTypewriter() {
    if (!CONFIG.enableTypewriter) return;

    // 为新加载的内容添加打字机效果
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('md-editor-preview')) {
            typewriterEffect(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function typewriterEffect(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.borderRight = '2px solid var(--cf-amber)';
    
    let i = 0;
    const speed = 10;
    
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        element.style.borderRight = 'none';
      }
    }
    
    type();
  }

  // ═══ 系统状态显示 ═══
  function initSystemStatus() {
    const statusBar = document.createElement('div');
    statusBar.id = 'cf-status-bar';
    statusBar.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      font-family: 'VT323', 'Share Tech Mono', monospace;
      font-size: 12px;
      color: #00ff41;
      text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
      z-index: 9996;
      opacity: 0.6;
      pointer-events: none;
    `;
    document.body.appendChild(statusBar);

    function updateStatus() {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour12: false });
      const date = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const memory = performance?.memory?.usedJSHeapSize 
        ? `MEM: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)}MB` 
        : '';
      
      statusBar.innerHTML = `
        <span style="color: #ffb000;">SYS</span> ${date} ${time} ${memory}
        <span style="color: #00ffff;">█</span>
      `;
    }

    updateStatus();
    setInterval(updateStatus, 1000);
  }

  // ═══ 鼠标轨迹效果 ═══
  function initMouseTrail() {
    let lastX = 0, lastY = 0;
    
    document.addEventListener('mousemove', (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 50) {
        createTrailParticle(e.clientX, e.clientY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
  }

  function createTrailParticle(x, y) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 4px;
      height: 4px;
      background: #00ffff;
      box-shadow: 0 0 10px #00ffff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9995;
      opacity: 0.8;
      transition: all 0.5s ease-out;
    `;
    document.body.appendChild(particle);
    
    setTimeout(() => {
      particle.style.opacity = '0';
      particle.style.transform = 'scale(0)';
    }, 50);
    
    setTimeout(() => particle.remove(), 600);
  }

  // ═══ 启动序列 ═══
  function initBootSequence() {
    if (!CONFIG.enableBootSequence) return;
    if (sessionStorage.getItem('cf-booted')) return;
    
    const bootScreen = document.createElement('div');
    bootScreen.id = 'cf-boot-screen';
    bootScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0a0a0f;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'VT323', monospace;
      color: #00ff41;
      font-size: 16px;
      padding: 20px;
    `;
    
    const bootLog = document.createElement('div');
    bootLog.style.cssText = `
      max-width: 600px;
      width: 100%;
      text-align: left;
      line-height: 1.8;
    `;
    bootScreen.appendChild(bootLog);
    document.body.appendChild(bootScreen);

    const messages = [
      '> SYSTEM BOOT SEQUENCE INITIATED...',
      '> LOADING KERNEL MODULES... OK',
      '> INITIALIZING DISPLAY DRIVER... OK',
      '> CASSETTE INTERFACE v3.0.4 LOADED',
      '> ESTABLISHING NEURAL LINK...',
      '> MEMORY CHECK: 640K OUGHT TO BE ENOUGH',
      '> ALL SYSTEMS NOMINAL',
      '> WELCOME, USER',
      ''
    ];

    let i = 0;
    function showMessage() {
      if (i < messages.length) {
        const line = document.createElement('div');
        line.textContent = messages[i];
        line.style.opacity = '0';
        bootLog.appendChild(line);
        
        setTimeout(() => {
          line.style.transition = 'opacity 0.2s';
          line.style.opacity = '1';
        }, 50);
        
        i++;
        setTimeout(showMessage, randomInt(100, 300));
      } else {
        setTimeout(() => {
          bootScreen.style.transition = 'opacity 0.5s';
          bootScreen.style.opacity = '0';
          setTimeout(() => {
            bootScreen.remove();
            sessionStorage.setItem('cf-booted', 'true');
          }, 500);
        }, 500);
      }
    }

    showMessage();
  }

  // ═══ 音效系统 (可选) ═══
  function initAmbientSound() {
    if (!CONFIG.enableAmbientSound) return;
    
    // 创建音频上下文 (需要用户交互后才能播放)
    let audioCtx = null;
    
    document.addEventListener('click', () => {
      if (audioCtx) return;
      
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建低频嗡嗡声
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(60, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
    }, { once: true });
  }

  // ═══ 初始化 ═══
  function init() {
    console.log('%c🎛️ CASSETTE FUTURISM THEME LOADED', 
      'color: #00ffff; font-size: 14px; font-weight: bold; text-shadow: 0 0 10px #00ffff;');
    
    initFlicker();
    initGlitch();
    initTypewriter();
    initSystemStatus();
    initMouseTrail();
    initBootSequence();
    initAmbientSound();
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
