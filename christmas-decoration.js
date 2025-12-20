/* ═══════════════════════════════════════════════════════════════
   🎄 CHRISTMAS DECORATION - 圣诞装饰
   带开关控制，可随时开启/关闭
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═══ 配置 ═══
  const CONFIG = {
    enableSnow: true,           // 飘雪效果
    enableLights: true,         // 彩灯装饰
    enableSanta: true,          // 圣诞老人飞过
    enableCardDecor: true,      // 卡片装饰
    snowflakeCount: 50,         // 雪花数量
    lightsCount: 20,            // 彩灯数量
    santaInterval: 30000,       // 圣诞老人出现间隔 (ms)
  };

  const STORAGE_KEY = 'christmas-decoration-enabled';
  let isEnabled = localStorage.getItem(STORAGE_KEY) !== 'false';
  let snowContainer = null;
  let lightsContainer = null;
  let santaTimer = null;
  let cardObserver = null;

  // ═══ 创建控制开关 ═══
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'christmas-toggle';
    btn.innerHTML = isEnabled ? '🎄' : '⭐';
    btn.title = isEnabled ? '关闭圣诞装饰' : '开启圣诞装饰';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      border: 2px solid ${isEnabled ? '#c41e3a' : '#666'};
      background: ${isEnabled ? 'linear-gradient(135deg, #165B33 0%, #146B3A 100%)' : '#333'};
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 99999;
      box-shadow: ${isEnabled ? '0 0 20px rgba(196, 30, 58, 0.5), 0 0 40px rgba(22, 91, 51, 0.3)' : '0 2px 10px rgba(0,0,0,0.3)'};
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    btn.addEventListener('click', toggleDecoration);
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(btn);
  }

  // ═══ 切换装饰 ═══
  function toggleDecoration() {
    isEnabled = !isEnabled;
    localStorage.setItem(STORAGE_KEY, isEnabled);
    
    const btn = document.getElementById('christmas-toggle');
    if (btn) {
      btn.innerHTML = isEnabled ? '🎄' : '⭐';
      btn.title = isEnabled ? '关闭圣诞装饰' : '开启圣诞装饰';
      btn.style.border = `2px solid ${isEnabled ? '#c41e3a' : '#666'}`;
      btn.style.background = isEnabled ? 'linear-gradient(135deg, #165B33 0%, #146B3A 100%)' : '#333';
      btn.style.boxShadow = isEnabled ? '0 0 20px rgba(196, 30, 58, 0.5), 0 0 40px rgba(22, 91, 51, 0.3)' : '0 2px 10px rgba(0,0,0,0.3)';
    }
    
    if (isEnabled) {
      startDecorations();
    } else {
      stopDecorations();
    }
  }

  // ═══ 启动所有装饰 ═══
  function startDecorations() {
    if (CONFIG.enableSnow) createSnow();
    if (CONFIG.enableLights) createLights();
    if (CONFIG.enableSanta) startSanta();
    if (CONFIG.enableCardDecor) startCardDecorations();
  }

  // ═══ 停止所有装饰 ═══
  function stopDecorations() {
    if (snowContainer) {
      snowContainer.remove();
      snowContainer = null;
    }
    if (lightsContainer) {
      lightsContainer.remove();
      lightsContainer = null;
    }
    if (santaTimer) {
      clearInterval(santaTimer);
      santaTimer = null;
    }
    if (cardObserver) {
      cardObserver.disconnect();
      cardObserver = null;
    }
    // 移除可能存在的圣诞老人
    const santa = document.getElementById('santa-sleigh');
    if (santa) santa.remove();
    // 移除卡片装饰
    removeCardDecorations();
  }

  // ═══ 飘雪效果 ═══
  function createSnow() {
    if (snowContainer) return;
    
    snowContainer = document.createElement('div');
    snowContainer.id = 'christmas-snow';
    snowContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99990;
      overflow: hidden;
    `;
    
    // 创建雪花
    for (let i = 0; i < CONFIG.snowflakeCount; i++) {
      createSnowflake(snowContainer);
    }
    
    document.body.appendChild(snowContainer);
  }

  function createSnowflake(container) {
    const snowflake = document.createElement('div');
    const size = Math.random() * 8 + 4;
    const startX = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 10;
    
    snowflake.innerHTML = ['❄', '❅', '❆', '✻', '✼'][Math.floor(Math.random() * 5)];
    snowflake.style.cssText = `
      position: absolute;
      top: -20px;
      left: ${startX}%;
      font-size: ${size}px;
      color: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5});
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
      animation: snowfall ${duration}s linear ${delay}s infinite;
      filter: blur(${Math.random() > 0.7 ? 1 : 0}px);
    `;
    
    container.appendChild(snowflake);
  }

  // ═══ 彩灯效果 ═══
  function createLights() {
    if (lightsContainer) return;
    
    lightsContainer = document.createElement('div');
    lightsContainer.id = 'christmas-lights';
    lightsContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 30px;
      pointer-events: none;
      z-index: 99991;
      display: flex;
      justify-content: space-around;
      align-items: flex-start;
      padding: 0 20px;
    `;
    
    // 彩灯线
    const wire = document.createElement('div');
    wire.style.cssText = `
      position: absolute;
      top: 8px;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #333 5%, 
        #333 95%, 
        transparent 100%
      );
      border-radius: 2px;
    `;
    lightsContainer.appendChild(wire);
    
    const colors = ['#ff0000', '#00ff00', '#ffff00', '#0080ff', '#ff00ff', '#ff8000'];
    
    for (let i = 0; i < CONFIG.lightsCount; i++) {
      const light = document.createElement('div');
      const color = colors[i % colors.length];
      const delay = i * 0.2;
      
      light.style.cssText = `
        width: 12px;
        height: 18px;
        background: ${color};
        border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color};
        animation: twinkle 1s ease-in-out ${delay}s infinite alternate;
        margin-top: 5px;
        position: relative;
      `;
      
      // 灯座
      const cap = document.createElement('div');
      cap.style.cssText = `
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 6px;
        background: #228B22;
        border-radius: 2px 2px 0 0;
      `;
      light.appendChild(cap);
      
      lightsContainer.appendChild(light);
    }
    
    document.body.appendChild(lightsContainer);
  }

  // ═══ 圣诞老人飞过 ═══
  function startSanta() {
    // 首次延迟出现
    setTimeout(showSanta, 5000);
    // 定时出现
    santaTimer = setInterval(showSanta, CONFIG.santaInterval);
  }

  function showSanta() {
    if (!isEnabled) return;
    
    const existing = document.getElementById('santa-sleigh');
    if (existing) return;
    
    const santa = document.createElement('div');
    santa.id = 'santa-sleigh';
    santa.innerHTML = '🦌🛷🎅';
    santa.style.cssText = `
      position: fixed;
      top: ${Math.random() * 30 + 5}%;
      left: -150px;
      font-size: 40px;
      z-index: 99992;
      animation: santaFly 8s linear forwards;
      filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
      pointer-events: none;
    `;
    
    document.body.appendChild(santa);
    
    // 动画结束后移除
    setTimeout(() => {
      santa.remove();
    }, 8000);
  }

  // ═══ 卡片装饰 ═══
  function startCardDecorations() {
    // 装饰现有卡片
    decorateExistingCards();
    
    // 监听新卡片
    cardObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.classList?.contains('will-change-transform')) {
              decorateCard(node);
            }
            // 检查子元素
            const cards = node.querySelectorAll?.('.will-change-transform');
            cards?.forEach(card => decorateCard(card));
          }
        });
      });
    });
    
    cardObserver.observe(document.body, { childList: true, subtree: true });
  }

  function decorateExistingCards() {
    const cards = document.querySelectorAll('.will-change-transform');
    cards.forEach(card => decorateCard(card));
  }

  function decorateCard(card) {
    if (card.dataset.christmasDecorated) return;
    card.dataset.christmasDecorated = 'true';
    
    // 随机选择装饰类型
    const decorTypes = ['holly', 'gift', 'candy', 'bell', 'star'];
    const decorType = decorTypes[Math.floor(Math.random() * decorTypes.length)];
    
    // 左上角装饰
    const leftDecor = document.createElement('div');
    leftDecor.className = 'christmas-card-decor christmas-card-decor-left';
    leftDecor.innerHTML = getDecorEmoji(decorType, 'left');
    leftDecor.style.cssText = `
      position: absolute;
      top: -8px;
      left: -8px;
      font-size: 20px;
      z-index: 10;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      transform: rotate(-15deg);
      pointer-events: none;
    `;
    
    // 右上角装饰
    const rightDecor = document.createElement('div');
    rightDecor.className = 'christmas-card-decor christmas-card-decor-right';
    rightDecor.innerHTML = getDecorEmoji(decorType, 'right');
    rightDecor.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 20px;
      z-index: 10;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      transform: rotate(15deg);
      pointer-events: none;
    `;
    
    // 确保卡片有相对定位
    const computedStyle = window.getComputedStyle(card);
    if (computedStyle.position === 'static') {
      card.style.position = 'relative';
    }
    
    card.appendChild(leftDecor);
    card.appendChild(rightDecor);
    
    // 添加圣诞边框效果
    card.style.setProperty('--christmas-border', '1px');
    card.classList.add('christmas-card-active');
  }

  function getDecorEmoji(type, position) {
    const decors = {
      holly: { left: '🎄', right: '⭐' },
      gift: { left: '🎁', right: '🎀' },
      candy: { left: '🍬', right: '🍭' },
      bell: { left: '🔔', right: '🎊' },
      star: { left: '✨', right: '🌟' },
    };
    return decors[type]?.[position] || '❄️';
  }

  function removeCardDecorations() {
    // 移除所有卡片装饰
    document.querySelectorAll('.christmas-card-decor').forEach(el => el.remove());
    document.querySelectorAll('[data-christmas-decorated]').forEach(card => {
      delete card.dataset.christmasDecorated;
      card.classList.remove('christmas-card-active');
    });
  }

  // ═══ 注入动画样式 ═══
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'christmas-styles';
    style.textContent = `
      @keyframes snowfall {
        0% {
          transform: translateY(0) rotate(0deg) translateX(0);
          opacity: 1;
        }
        25% {
          transform: translateY(25vh) rotate(90deg) translateX(10px);
        }
        50% {
          transform: translateY(50vh) rotate(180deg) translateX(-10px);
        }
        75% {
          transform: translateY(75vh) rotate(270deg) translateX(10px);
        }
        100% {
          transform: translateY(100vh) rotate(360deg) translateX(0);
          opacity: 0.3;
        }
      }
      
      @keyframes twinkle {
        0% {
          opacity: 0.4;
          transform: scale(0.9);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes santaFly {
        0% {
          left: -150px;
          transform: translateY(0);
        }
        25% {
          transform: translateY(-20px);
        }
        50% {
          transform: translateY(10px);
        }
        75% {
          transform: translateY(-15px);
        }
        100% {
          left: calc(100% + 150px);
          transform: translateY(0);
        }
      }
      
      @keyframes gentleSway {
        0%, 100% { transform: rotate(-15deg); }
        50% { transform: rotate(-10deg); }
      }
      
      @keyframes gentleSwayRight {
        0%, 100% { transform: rotate(15deg); }
        50% { transform: rotate(10deg); }
      }
      
      #christmas-toggle:active {
        transform: scale(0.95) !important;
      }
      
      /* 卡片装饰动画 */
      .christmas-card-decor-left {
        animation: gentleSway 3s ease-in-out infinite;
      }
      
      .christmas-card-decor-right {
        animation: gentleSwayRight 3s ease-in-out infinite;
      }
      
      /* 圣诞卡片边框 */
      .christmas-card-active {
        border-image: linear-gradient(
          90deg, 
          #c41e3a 0%, 
          #165B33 25%, 
          #c41e3a 50%, 
          #165B33 75%, 
          #c41e3a 100%
        ) 1 !important;
        animation: christmasBorder 3s linear infinite;
        background-size: 200% 200%;
      }
      
      @keyframes christmasBorder {
        0% { border-color: #c41e3a; }
        50% { border-color: #165B33; }
        100% { border-color: #c41e3a; }
      }
      
      /* 悬停时装饰放大 */
      .will-change-transform:hover .christmas-card-decor {
        transform: scale(1.2);
        transition: transform 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  // ═══ 初始化 ═══
  function init() {
    console.log('%c🎄 Christmas Decoration Loaded! 🎅', 
      'color: #c41e3a; font-size: 14px; font-weight: bold;');
    
    injectStyles();
    createToggleButton();
    
    if (isEnabled) {
      startDecorations();
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
