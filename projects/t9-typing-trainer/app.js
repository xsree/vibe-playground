
  /**
   * ==========================================================================
   * 九宫格盲打特训器核心逻辑 (Pure Native JavaScript, Zero External Dependencies)
   * ==========================================================================
   */

  // 1. 标准九宫格键位映射与相对 5 键的方向位移说明
  const KEY_MAP = {
    '1': { letters: [], label: '分词/符号', dir: '↖ 左上功能角', desc: '音节分隔/符号键' },
    '2': { letters: ['a', 'b', 'c'], label: 'ABC', dir: '↑ 正上方', desc: '上排中键 · 含元音 a' },
    '3': { letters: ['d', 'e', 'f'], label: 'DEF', dir: '↗ 右上方', desc: '右上角 · 含元音 e' },
    '4': { letters: ['g', 'h', 'i'], label: 'GHI', dir: '← 正左方', desc: '中排左键 · 含元音 i' },
    '5': { letters: ['j', 'k', 'l'], label: 'JKL', dir: '● 中心原点', desc: '拇指基准原点 · JKL' },
    '6': { letters: ['m', 'n', 'o'], label: 'MNO', dir: '→ 正右方', desc: '中排右键 · 含元音 o' },
    '7': { letters: ['p', 'q', 'r', 's'], label: 'PQRS', dir: '↙ 左下方', desc: '左下四角 · 四字母键' },
    '8': { letters: ['t', 'u', 'v'], label: 'TUV', dir: '↓ 正下方', desc: '下排中键 · 含元音 u/ü' },
    '9': { letters: ['w', 'x', 'y', 'z'], label: 'WXYZ', dir: '↘ 右下方', desc: '右下四角 · 四字母键' }
  };

  // 反向查找表：字母 -> 所属数字键 ('a' -> '2')
  const LETTER_TO_KEY = {};
  Object.entries(KEY_MAP).forEach(([digit, info]) => {
    info.letters.forEach(ch => {
      LETTER_TO_KEY[ch] = digit;
    });
  });

  // 2. 锚点速记分组词库
  const ANCHOR_GROUPS = {
    origin: {
      name: 'JKL中心原点(5键)',
      letters: ['j', 'k', 'l', 'j', 'k', 'l', 'h', 'm', 'e', 'u']
    },
    vowels: {
      name: '五大元音顺位',
      letters: ['a', 'e', 'i', 'o', 'u']
    },
    corners: {
      name: '四角四字母(7/9)',
      letters: ['p', 'q', 'r', 's', 'w', 'x', 'y', 'z']
    },
    all: {
      name: '全字母随机反应',
      letters: 'abcdefghijklmnopqrstuvwxyz'.split('')
    }
  };

  // 3. 内置 60+ 日常高频双字、三字、四字词及短句库
  const BUILTIN_WORDS = [
    { hanzi: '好的', pinyin: 'haode' },
    { hanzi: '可以', pinyin: 'keyi' },
    { hanzi: '没问题', pinyin: 'meiwenti' },
    { hanzi: '不好意思', pinyin: 'buhaoyisi' },
    { hanzi: '在路上', pinyin: 'zailushang' },
    { hanzi: '马上到', pinyin: 'mashangdao' },
    { hanzi: '辛苦了', pinyin: 'xinkule' },
    { hanzi: '怎么了', pinyin: 'zenmele' },
    { hanzi: '知道了', pinyin: 'zhidaole' },
    { hanzi: '一会儿见', pinyin: 'yihuirjian' },
    { hanzi: '收到请回复', pinyin: 'shoudaoqinghuifu' },
    { hanzi: '今天下班早', pinyin: 'jintianxiabanzao' },
    { hanzi: '没关系', pinyin: 'meiguanxi' },
    { hanzi: '稍等一下', pinyin: 'shaodengyixia' },
    { hanzi: '发我微信', pinyin: 'fawoweixin' },
    { hanzi: '一起吃饭', pinyin: 'yiqichifan' },
    { hanzi: '注意安全', pinyin: 'zhuyianquan' },
    { hanzi: '晚安好梦', pinyin: 'wananhaomeng' },
    { hanzi: '早点休息', pinyin: 'zaodianxiuxi' },
    { hanzi: '你先忙吧', pinyin: 'nixianmangba' },
    { hanzi: '周末愉快', pinyin: 'zhoumouyukuai' },
    { hanzi: '太棒了吧', pinyin: 'taibangleba' },
    { hanzi: '谢谢老板', pinyin: 'xiexielaoban' },
    { hanzi: '已收到', pinyin: 'yishoudao' },
    { hanzi: '等我五分钟', pinyin: 'dengwowufenzhong' },
    { hanzi: '你在哪里', pinyin: 'nizainali' },
    { hanzi: '我刚下地铁', pinyin: 'wogangxiaditie' },
    { hanzi: '帮我带杯咖啡', pinyin: 'bangwodaibeikafei' },
    { hanzi: '晚点联系你', pinyin: 'wandianlianxini' },
    { hanzi: '真的假的', pinyin: 'zhendejiade' },
    { hanzi: '哈哈哈哈', pinyin: 'hahahaha' },
    { hanzi: '安排上了', pinyin: 'anpaishangle' },
    { hanzi: '辛苦大家了', pinyin: 'xinkudajiale' },
    { hanzi: '正在开会', pinyin: 'zhengzaikaihui' },
    { hanzi: '方便接电话吗', pinyin: 'fangbianjiedianhuama' },
    { hanzi: '我打字给你', pinyin: 'wodazigeini' },
    { hanzi: '文件发你了', pinyin: 'wenjianfanile' },
    { hanzi: '麻烦确认一下', pinyin: 'mafanquerenyixia' },
    { hanzi: '一路顺风', pinyin: 'yilushunfeng' },
    { hanzi: '保重身体', pinyin: 'baozhongshenti' },
    { hanzi: '生日快乐', pinyin: 'shengrikuaile' },
    { hanzi: '恭喜发财', pinyin: 'gongxifacai' },
    { hanzi: '万事如意', pinyin: 'wanshiruyi' },
    { hanzi: '心想事成', pinyin: 'xinxiangshicheng' },
    { hanzi: '顺顺利利', pinyin: 'shunshunlili' },
    { hanzi: '今天天气真好', pinyin: 'jintiantianqizhenhao' },
    { hanzi: '去哪儿吃晚饭', pinyin: 'qunaerchiwanfan' },
    { hanzi: '记得按时吃饭', pinyin: 'jideanshichifan' },
    { hanzi: '先这样吧', pinyin: 'xianzheyangba' },
    { hanzi: '回头再聊', pinyin: 'huitouzailiao' },
    { hanzi: '完全同意', pinyin: 'wanquantongyi' },
    { hanzi: '很有道理', pinyin: 'henyoudaoli' },
    { hanzi: '太麻烦你了', pinyin: 'taimafannile' },
    { hanzi: '不用客气', pinyin: 'buyongkeqi' },
    { hanzi: '随时找我', pinyin: 'suishizhaowo' },
    { hanzi: '准时出发', pinyin: 'zhunshichufa' },
    { hanzi: '已经到楼下了', pinyin: 'yijingdaolouxiale' },
    { hanzi: '点个外卖吧', pinyin: 'diangewaimaiba' },
    { hanzi: '旅游愉快', pinyin: 'lvyouyukuai' },
    { hanzi: '九宫格盲打', pinyin: 'jiugonggemangda' }
  ];

  // 4. 整句挑战模式长短句库
  const CHALLENGE_SENTENCES = [
    { hanzi: '我现在在路上马上就到', pinyin: 'woxianzaizailushangmashangjiudao' },
    { hanzi: '收到请回复谢谢大家配合', pinyin: 'shoudaoqinghuifuxiexiedajiapeihe' },
    { hanzi: '不好意思让你久等了', pinyin: 'buhaoyisirangnijiudengle' },
    { hanzi: '今天下班早一起去吃饭吧', pinyin: 'jintianxiabanzaoyiqiquchifanba' },
    { hanzi: '正在开会稍后给你回电话', pinyin: 'zhengzaikaihuishaohougeinihuidianhua' },
    { hanzi: '文件已经发送到你邮箱了', pinyin: 'wenjianyijingfasongdaoniyouxiangle' },
    { hanzi: '天气变冷了记得多穿点衣服', pinyin: 'tianqibianlenglejideduochuandianyifu' },
    { hanzi: '单手打字其实非常轻松顺畅', pinyin: 'danshoudaziqishifeichangqingsongshunchang' },
    { hanzi: '周末有空的话一起去看电影', pinyin: 'zhoumouyoukongdehuayiqiqukandianying' },
    { hanzi: '谢谢你的帮忙改天请你喝咖啡', pinyin: 'xiexienidebangmanggaidianqingnihekafei' },
    { hanzi: '我已经到地铁站出口等你了', pinyin: 'woyijingdaoditiezhanchukoudengnile' },
    { hanzi: '晚安早点休息明天继续加油', pinyin: 'wananzaodianxiuximingtiangjixujiayou' }
  ];

  // ==========================================================================
  // 5. Web Audio API 机械按键音效合成器 (无需外部音频文件)
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTap(isCenterOrigin = false) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 机械轴体短促敲击声 (高频瞬态 + 低频腔体共鸣)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const baseFreq = isCenterOrigin ? 520 : 420;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.035);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (e) {
        // 忽略自动播放限制异常
      }
    }

    playError() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.linearRampToValueAtTime(125, now + 0.11);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    playComplete() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [587.33, 880]; // D5 -> A5 清脆上屏提示音
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.045);
          gain.gain.setValueAtTime(0.1, now + idx * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.09);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.045);
          osc.stop(now + idx * 0.045 + 0.1);
        });
      } catch (e) {}
    }
  }

  const sound = new SoundEngine();

  // ==========================================================================
  // 6. 应用全局状态管理 (Application State)
  // ==========================================================================
  const STORAGE_KEY_STATS = 't9_trainer_weakness_stats_v1';
  const STORAGE_KEY_CUSTOM = 't9_trainer_custom_words_v1';

  const state = {
    mode: 'anchor',          // 'anchor' | 'words' | 'challenge'
    maskLevel: 1,            // 1 | 2 | 3
    handMode: 'center',      // 'center' | 'left' | 'right'
    vibrateEnabled: true,

    // 锚点模式子选项
    anchorGroup: 'origin',   // 'origin' | 'vowels' | 'corners' | 'all' | 'weakness'
    weakDrillLetters: [],    // 针对薄弱字母强化时的目标池

    // 高频词模式子选项
    wordOrder: 'seq',        // 'seq' | 'rand'
    wordSource: 'all',       // 'all' | 'custom'
    wordIndex: 0,
    customWords: [],

    // 当前题目状态
    currentItem: { hanzi: 'J', pinyin: 'j' },
    charIndex: 0,            // 当前正在敲击的拼音字符索引
    isPeeking: false,        // Lv.3 偷看拼音状态

    // 实时会话统计
    streak: 0,
    maxStreak: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    completedHanziCount: 0,
    sessionStartTime: null,

    // 60秒挑战计时状态
    challengeRunning: false,
    challengeTimeLeft: 60,
    challengeTimerId: null,
    challengeHanzi: 0,
    challengeTotalKeys: 0,
    challengeCorrectKeys: 0,
    challengeMaxStreak: 0,

    // 持久化字母错误热力统计: { a: { attempts: 0, errors: 0 }, ... }
    letterStats: {}
  };

  // 初始化持久化数据
  function loadPersistedData() {
    try {
      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (savedStats) {
        state.letterStats = JSON.parse(savedStats);
      }
      const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (savedCustom) {
        state.customWords = JSON.parse(savedCustom);
      }
    } catch (e) {
      state.letterStats = {};
      state.customWords = [];
    }
  }

  function saveLetterStats() {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(state.letterStats));
    } catch (e) {}
  }

  function saveCustomWords() {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(state.customWords));
    } catch (e) {}
  }

  // ==========================================================================
  // 7. DOM 引用缓存
  // ==========================================================================
  const dom = {
    toast: document.getElementById('toastBanner'),
    btnSound: document.getElementById('btnSound'),
    btnVibrate: document.getElementById('btnVibrate'),
    statStreak: document.getElementById('statStreak'),
    statAccuracy: document.getElementById('statAccuracy'),
    statSpeed: document.getElementById('statSpeed'),
    statSpeedLabel: document.getElementById('statSpeedLabel'),
    stageCard: document.getElementById('stageCard'),
    stageToolbar: document.getElementById('stageToolbar'),
    timerBarWrap: document.getElementById('timerBarWrap'),
    timerBarFill: document.getElementById('timerBarFill'),
    promptHanzi: document.getElementById('promptHanzi'),
    pinyinStream: document.getElementById('pinyinStream'),
    btnPeekPinyin: document.getElementById('btnPeekPinyin'),
    keyGuideBadge: document.getElementById('keyGuideBadge'),
    radarGrid: document.getElementById('radarGrid'),
    radarText: document.getElementById('radarText'),
    weakSummaryText: document.getElementById('weakSummaryText'),
    keyboardContainer: document.getElementById('keyboardContainer'),
    t9Keys: Array.from(document.querySelectorAll('.t9-key')),
    radarCells: Array.from(document.querySelectorAll('.radar-cell'))
  };

  let toastTimer = null;
  function showToast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 1800);
  }

  function triggerHaptic(pattern = 18) {
    if (state.vibrateEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // ==========================================================================
  // 8. 题库生成与舞台渲染逻辑
  // ==========================================================================
  function getActiveWordPool() {
    if (state.wordSource === 'custom' && state.customWords.length > 0) {
      return state.customWords;
    }
    return [...BUILTIN_WORDS, ...state.customWords];
  }

  function pickNextItem(advanceSeq = true) {
    state.charIndex = 0;
    state.isPeeking = false;

    if (state.mode === 'anchor') {
      let pool = [];
      if (state.anchorGroup === 'weakness' && state.weakDrillLetters.length > 0) {
        pool = state.weakDrillLetters;
      } else {
        pool = (ANCHOR_GROUPS[state.anchorGroup] && ANCHOR_GROUPS[state.anchorGroup].letters) || ANCHOR_GROUPS.origin.letters;
      }
      // 尽量避免连续两次完全相同的字母
      let nextChar = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && nextChar === state.currentItem.pinyin) {
        const filtered = pool.filter(c => c !== nextChar);
        nextChar = filtered[Math.floor(Math.random() * filtered.length)];
      }
      state.currentItem = {
        hanzi: nextChar.toUpperCase(),
        pinyin: nextChar
      };
    } else if (state.mode === 'words') {
      const pool = getActiveWordPool();
      if (state.wordOrder === 'rand') {
        const idx = Math.floor(Math.random() * pool.length);
        state.wordIndex = idx;
        state.currentItem = pool[idx];
      } else {
        if (advanceSeq) {
          state.wordIndex = (state.wordIndex + 1) % pool.length;
        } else {
          state.wordIndex = state.wordIndex % pool.length;
        }
        state.currentItem = pool[state.wordIndex];
      }
    } else if (state.mode === 'challenge') {
      const idx = Math.floor(Math.random() * CHALLENGE_SENTENCES.length);
      state.currentItem = CHALLENGE_SENTENCES[idx];
    }

    renderStage();
  }

  function renderToolbar() {
    if (state.mode === 'anchor') {
      const groups = [
        { id: 'origin', label: 'JKL原点(5)' },
        { id: 'vowels', label: '五大元音' },
        { id: 'corners', label: '四角四字母' },
        { id: 'all', label: '全字母随机' }
      ];
      if (state.weakDrillLetters.length > 0) {
        groups.push({ id: 'weakness', label: '🎯薄弱强化' });
      }
      dom.stageToolbar.innerHTML = `
        <div class="sub-pills">
          ${groups.map(g => `
            <button class="sub-pill ${state.anchorGroup === g.id ? 'active' : ''}" data-agroup="${g.id}">${g.label}</button>
          `).join('')}
        </div>
      `;
      dom.stageToolbar.querySelectorAll('[data-agroup]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.anchorGroup = btn.dataset.agroup;
          renderToolbar();
          pickNextItem(false);
        });
      });
    } else if (state.mode === 'words') {
      const pool = getActiveWordPool();
      dom.stageToolbar.innerHTML = `
        <div class="sub-pills">
          <button class="sub-pill ${state.wordOrder === 'seq' ? 'active' : ''}" id="btnOrderSeq">顺序</button>
          <button class="sub-pill ${state.wordOrder === 'rand' ? 'active' : ''}" id="btnOrderRand">随机</button>
          <button class="mini-action-btn" id="btnOpenCustom">✍️ 自定义(${state.customWords.length})</button>
        </div>
        <div class="stage-meta">
          <span>${state.wordIndex + 1}/${pool.length}</span>
        </div>
      `;
      document.getElementById('btnOrderSeq').onclick = () => {
        state.wordOrder = 'seq';
        renderToolbar();
      };
      document.getElementById('btnOrderRand').onclick = () => {
        state.wordOrder = 'rand';
        renderToolbar();
        pickNextItem(false);
      };
      document.getElementById('btnOpenCustom').onclick = openCustomModal;
    } else if (state.mode === 'challenge') {
      dom.stageToolbar.innerHTML = `
        <div class="sub-pills">
          <span style="font-size:12px;font-weight:700;color:#2563EB;">
            ${state.challengeRunning ? '🔥 冲刺进行中...' : '⌨️ 按任意目标键立即开始 60s 计时'}
          </span>
        </div>
        <div class="stage-meta">
          <span style="font-size:14px;font-weight:800;color:${state.challengeTimeLeft <= 10 ? '#EF4444' : '#0F172A'};" id="challengeClock">
            ${state.challengeTimeLeft}s
          </span>
          <button class="mini-action-btn" id="btnResetChallenge">重置</button>
        </div>
      `;
      document.getElementById('btnResetChallenge').onclick = () => {
        resetChallengeState();
        pickNextItem(false);
      };
    }
  }

  function renderStage() {
    const { hanzi, pinyin } = state.currentItem;
    const targetChar = pinyin[state.charIndex] || pinyin[0];
    const targetDigit = LETTER_TO_KEY[targetChar] || '5';
    const keyInfo = KEY_MAP[targetDigit];

    // 1. 汉字/字母大标题
    dom.promptHanzi.textContent = hanzi;
    dom.promptHanzi.classList.remove('long-sentence', 'anchor-letter');
    if (state.mode === 'anchor') {
      dom.promptHanzi.classList.add('anchor-letter');
    } else if (hanzi.length >= 7) {
      dom.promptHanzi.classList.add('long-sentence');
    }

    // 2. 拼音流渲染（根据盲打遮罩等级决定是否隐藏）
    const hidePinyinInLv3 = (state.maskLevel === 3 && state.mode !== 'anchor' && !state.isPeeking);
    if (hidePinyinInLv3) {
      dom.pinyinStream.innerHTML = `<span style="font-size:13px;color:#94A3B8;font-family:var(--font-sans);">已隐藏拼音 (${state.charIndex}/${pinyin.length} 键)</span>`;
      dom.btnPeekPinyin.classList.add('visible');
    } else {
      dom.btnPeekPinyin.classList.remove('visible');
      dom.pinyinStream.innerHTML = pinyin.split('').map((ch, idx) => {
        let cls = 'py-char';
        if (idx < state.charIndex) cls += ' done';
        else if (idx === state.charIndex) cls += ' current';
        return `<span class="${cls}">${ch}</span>`;
      }).join('');
    }

    // 3. 新手引导提示胶囊 (仅 Lv.1 显示具体数字提示)
    if (state.maskLevel === 1) {
      dom.keyGuideBadge.style.display = 'inline-flex';
      dom.keyGuideBadge.textContent = `当前字母「${targetChar.toUpperCase()}」→ 按 ${targetDigit} 键 (${keyInfo.desc})`;
    } else {
      dom.keyGuideBadge.style.display = 'none';
    }

    // 4. 微型九宫格雷达图更新
    // Lv.1 和 Lv.2 实时显示相对 5 键的方向位移，Lv.3 仅在按键时瞬时反馈，平时保持神秘盲打感
    dom.radarCells.forEach(cell => {
      cell.classList.remove('target');
      if (state.maskLevel < 3 && cell.dataset.rkey === targetDigit) {
        cell.classList.add('target');
      }
    });

    if (state.maskLevel < 3) {
      dom.radarText.textContent = `相对5键：${keyInfo.dir}`;
    } else {
      dom.radarText.textContent = `纯盲打模式 · 拇指凭空间记忆落点`;
    }

    // 5. 更新工具栏计数
    if (state.mode === 'words') {
      const pool = getActiveWordPool();
      const metaSpan = dom.stageToolbar.querySelector('.stage-meta span');
      if (metaSpan) metaSpan.textContent = `${state.wordIndex + 1}/${pool.length}`;
    }
  }

  // ==========================================================================
  // 9. 核心按键判别与智能纠错提示 (Input Handler & Smart Correction)
  // ==========================================================================
  let hintTimer = null;

  function flashKeyVisual(digit, className, duration = 220) {
    const btn = dom.t9Keys.find(k => k.dataset.key === digit);
    if (!btn) return;
    btn.classList.add(className);
    setTimeout(() => {
      btn.classList.remove(className);
    }, duration);
  }

  function highlightTargetHint(targetDigit) {
    // 清除旧的提示闪烁
    dom.t9Keys.forEach(k => k.classList.remove('key-target-hint'));
    clearTimeout(hintTimer);

    const targetBtn = dom.t9Keys.find(k => k.dataset.key === targetDigit);
    if (targetBtn) {
      targetBtn.classList.add('key-target-hint');
      hintTimer = setTimeout(() => {
        targetBtn.classList.remove('key-target-hint');
      }, 600); // 按要求在正确目标键温和闪烁琥珀色提示 0.6 秒
    }
  }

  function flashRadarCell(digit) {
    const cell = dom.radarCells.find(c => c.dataset.rkey === digit);
    if (!cell) return;
    cell.classList.add('target');
    setTimeout(() => {
      if (state.maskLevel === 3) {
        cell.classList.remove('target');
      }
    }, 350);
  }

  function recordLetterAttempt(letter, isCorrect) {
    if (!state.letterStats[letter]) {
      state.letterStats[letter] = { attempts: 0, errors: 0 };
    }
    state.letterStats[letter].attempts += 1;
    if (!isCorrect) {
      state.letterStats[letter].errors += 1;
    }
    saveLetterStats();
    updateWeaknessSummaryBadge();
  }

  function handleNineKeyPress(pressedDigit) {
    // 1键为分词/符号辅助键：在拼音训练中给予轻微触感反馈，不判错不中断节奏
    if (pressedDigit === '1') {
      sound.playTap(false);
      triggerHaptic(12);
      flashKeyVisual('1', 'is-pressed', 140);
      showToast('1 键为分词/符号键，请按 2-9 键输入拼音字母');
      return;
    }

    // 挑战模式下首击自动启动 60 秒倒计时
    if (state.mode === 'challenge' && !state.challengeRunning) {
      startChallengeTimer();
    }

    if (!state.sessionStartTime) {
      state.sessionStartTime = Date.now();
    }

    const { hanzi, pinyin } = state.currentItem;
    const expectedChar = pinyin[state.charIndex];
    const expectedDigit = LETTER_TO_KEY[expectedChar];

    state.totalKeystrokes += 1;
    if (state.mode === 'challenge') state.challengeTotalKeys += 1;

    if (pressedDigit === expectedDigit) {
      // ✅ 按键正确
      sound.playTap(pressedDigit === '5');
      triggerHaptic(18);
      flashKeyVisual(pressedDigit, 'is-pressed', 130);
      flashRadarCell(pressedDigit);

      // 移除可能残留的错误提示高亮
      dom.t9Keys.forEach(k => k.classList.remove('key-target-hint'));

      state.correctKeystrokes += 1;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;

      if (state.mode === 'challenge') {
        state.challengeCorrectKeys += 1;
        if (state.streak > state.challengeMaxStreak) {
          state.challengeMaxStreak = state.streak;
        }
      }

      recordLetterAttempt(expectedChar, true);
      state.charIndex += 1;

      if (state.charIndex >= pinyin.length) {
        // 整词 / 整句 / 单字母完成！
        const hanziUnits = state.mode === 'anchor' ? 1 : hanzi.length;
        state.completedHanziCount += hanziUnits;
        if (state.mode === 'challenge') {
          state.challengeHanzi += hanziUnits;
        }

        sound.playComplete();
        dom.stageCard.classList.add('flash-success');
        setTimeout(() => dom.stageCard.classList.remove('flash-success'), 180);

        updateDashboard();
        // 稍作极短停顿展示全绿完成态，立即切入下一题保持心流
        setTimeout(() => {
          pickNextItem(true);
        }, state.mode === 'anchor' ? 75 : 130);
      } else {
        updateDashboard();
        renderStage();
      }
    } else {
      // ❌ 按键错误：不中断当前词进度，红闪误触键 + 0.6s 琥珀色提示正确目标键
      sound.playError();
      triggerHaptic([25, 30, 25]);
      flashKeyVisual(pressedDigit, 'key-error', 300);
      highlightTargetHint(expectedDigit);

      dom.stageCard.classList.add('flash-error');
      setTimeout(() => dom.stageCard.classList.remove('flash-error'), 220);

      state.streak = 0;
      recordLetterAttempt(expectedChar, false);
      updateDashboard();
    }
  }

  function updateDashboard() {
    // 1. 连击
    dom.statStreak.textContent = state.streak;
    if (state.streak >= 10) {
      dom.statStreak.classList.add('streak-hot');
    } else {
      dom.statStreak.classList.remove('streak-hot');
    }

    // 2. 准确率
    if (state.mode === 'challenge' && state.challengeRunning) {
      const acc = state.challengeTotalKeys === 0
        ? 100
        : Math.round((state.challengeCorrectKeys / state.challengeTotalKeys) * 100);
      dom.statAccuracy.textContent = `${acc}%`;
    } else {
      const acc = state.totalKeystrokes === 0
        ? 100
        : Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100);
      dom.statAccuracy.textContent = `${acc}%`;
    }

    // 3. 速度 (字/分)
    if (state.mode === 'challenge') {
      dom.statSpeedLabel.textContent = '冲刺速度 (字/分)';
      const elapsedSec = Math.max(1, 60 - state.challengeTimeLeft);
      const wpm = state.challengeRunning
        ? Math.round((state.challengeHanzi / elapsedSec) * 60)
        : 0;
      dom.statSpeed.textContent = wpm;
    } else {
      dom.statSpeedLabel.textContent = state.mode === 'anchor' ? '反应速度 (击/分)' : '速度 (字/分)';
      if (!state.sessionStartTime || state.completedHanziCount === 0) {
        dom.statSpeed.textContent = '0';
      } else {
        const elapsedMin = Math.max(0.05, (Date.now() - state.sessionStartTime) / 60000);
        const speed = Math.round(state.completedHanziCount / elapsedMin);
        dom.statSpeed.textContent = Math.min(speed, 999);
      }
    }
  }

  // ==========================================================================
  // 10. 60秒整句盲打挑战计时器
  // ==========================================================================
  function resetChallengeState() {
    clearInterval(state.challengeTimerId);
    state.challengeTimerId = null;
    state.challengeRunning = false;
    state.challengeTimeLeft = 60;
    state.challengeHanzi = 0;
    state.challengeTotalKeys = 0;
    state.challengeCorrectKeys = 0;
    state.challengeMaxStreak = 0;
    state.streak = 0;
    dom.timerBarFill.style.width = '100%';
    dom.timerBarFill.classList.remove('urgent');
    renderToolbar();
    updateDashboard();
  }

  function startChallengeTimer() {
    if (state.challengeRunning) return;
    state.challengeRunning = true;
    state.challengeTimeLeft = 60;
    renderToolbar();

    state.challengeTimerId = setInterval(() => {
      state.challengeTimeLeft -= 1;
      const pct = Math.max(0, (state.challengeTimeLeft / 60) * 100);
      dom.timerBarFill.style.width = `${pct}%`;
      if (state.challengeTimeLeft <= 10) {
        dom.timerBarFill.classList.add('urgent');
      }
      const clockEl = document.getElementById('challengeClock');
      if (clockEl) {
        clockEl.textContent = `${state.challengeTimeLeft}s`;
        if (state.challengeTimeLeft <= 10) clockEl.style.color = '#EF4444';
      }
      updateDashboard();

      if (state.challengeTimeLeft <= 0) {
        finishChallenge();
      }
    }, 1000);
  }

  function finishChallenge() {
    clearInterval(state.challengeTimerId);
    state.challengeRunning = false;
    sound.playComplete();

    const finalSpeed = state.challengeHanzi; // 整整60秒完成的字数即为 字/分
    const finalAcc = state.challengeTotalKeys === 0
      ? 100
      : Math.round((state.challengeCorrectKeys / state.challengeTotalKeys) * 100);

    document.getElementById('sumSpeed').textContent = finalSpeed;
    document.getElementById('sumAcc').textContent = `${finalAcc}%`;
    document.getElementById('sumMaxStreak').textContent = state.challengeMaxStreak;

    let comment = '稳扎稳打！继续保持拇指对 5 键原点的空间感。';
    if (finalSpeed >= 45 && finalAcc >= 95) {
      comment = '🔥 惊人的单手盲打水准！你的九宫格肌肉记忆已经完全成型！';
    } else if (finalSpeed >= 25) {
      comment = '👏 节奏非常流畅！试着把盲打遮罩调高一级，进一步摆脱视觉依赖。';
    }
    document.getElementById('sumComment').textContent = comment;
    document.getElementById('modalSummary').classList.add('open');
  }

  // ==========================================================================
  // 11. 薄弱键位诊断与热力分析
  // ==========================================================================
  function getTopWeakLetters(limit = 3) {
    const entries = Object.entries(state.letterStats)
      .filter(([, s]) => s.attempts >= 1 && s.errors > 0)
      .map(([letter, s]) => ({
        letter,
        key: LETTER_TO_KEY[letter],
        attempts: s.attempts,
        errors: s.errors,
        rate: Math.round((s.errors / s.attempts) * 100)
      }))
      .sort((a, b) => b.rate - a.rate || b.errors - a.errors);

    return entries.slice(0, limit);
  }

  function updateWeaknessSummaryBadge() {
    const topWeak = getTopWeakLetters(3);
    if (topWeak.length === 0) {
      dom.weakSummaryText.textContent = '薄弱键位诊断';
    } else {
      const summary = topWeak.map(w => `${w.letter.toUpperCase()}(${w.key})`).join(' ');
      dom.weakSummaryText.textContent = `易错: ${summary}`;
    }
  }

  function openWeaknessModal() {
    const topWeak = getTopWeakLetters(3);
    const listEl = document.getElementById('weakTopList');

    if (topWeak.length === 0) {
      listEl.innerHTML = `
        <div style="padding:14px;text-align:center;background:#F8FAFC;border-radius:12px;color:#64748B;font-size:13px;">
          暂无错误记录！开始敲击练习后，系统会自动分析你最容易按偏的键位。
        </div>
      `;
    } else {
      listEl.innerHTML = topWeak.map((item, idx) => `
        <div class="weak-item">
          <div class="weak-item-left">
            <span class="weak-rank">#${idx + 1}</span>
            <div>
              <div class="weak-letter-title">字母 ${item.letter.toUpperCase()} · 属于 ${item.key} 键 (${KEY_MAP[item.key].label})</div>
              <div class="weak-sub">${KEY_MAP[item.key].dir} · 累计失误 ${item.errors}/${item.attempts} 次</div>
            </div>
          </div>
          <span class="weak-rate">${item.rate}% 错</span>
        </div>
      `).join('');
    }

    // 渲染 2-9 键热力格子
    const heatGrid = document.getElementById('heatmapGrid');
    heatGrid.innerHTML = ['2', '3', '4', '5', '6', '7', '8', '9'].map(digit => {
      const info = KEY_MAP[digit];
      let attempts = 0;
      let errors = 0;
      info.letters.forEach(ch => {
        if (state.letterStats[ch]) {
          attempts += state.letterStats[ch].attempts;
          errors += state.letterStats[ch].errors;
        }
      });
      const rate = attempts === 0 ? 0 : Math.round((errors / attempts) * 100);
      let bg = '#F8FAFC';
      let color = '#64748B';
      if (rate >= 25) { bg = '#FEE2E2'; color = '#DC2626'; }
      else if (rate >= 10) { bg = '#FEF3C7'; color = '#D97706'; }
      else if (attempts > 0) { bg = '#ECFDF5'; color = '#059669'; }

      return `
        <div class="heat-cell" style="background:${bg};">
          <div class="heat-cell-num">${digit} 键</div>
          <div class="heat-cell-letters">${info.label}</div>
          <div class="heat-cell-stat" style="color:${color};">${attempts === 0 ? '未练习' : `错误率 ${rate}%`}</div>
        </div>
      `;
    }).join('');

    document.getElementById('modalWeakness').classList.add('open');
  }

  // ==========================================================================
  // 12. 自定义词句弹窗逻辑
  // ==========================================================================
  function openCustomModal() {
    const textarea = document.getElementById('customTextarea');
    textarea.value = state.customWords.map(w => `${w.hanzi} ${w.pinyin}`).join('\n');
    document.getElementById('modalCustom').classList.add('open');
  }

  function parseAndSaveCustomWords(onlyCustomMode) {
    const raw = document.getElementById('customTextarea').value.trim();
    const lines = raw.split('\n');
    const parsed = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const hanzi = parts[0];
        const pinyin = parts.slice(1).join('').toLowerCase().replace(/[^a-z]/g, '');
        if (hanzi && pinyin) {
          parsed.push({ hanzi, pinyin });
        }
      }
    });

    state.customWords = parsed;
    saveCustomWords();

    if (onlyCustomMode && parsed.length > 0) {
      state.wordSource = 'custom';
      showToast(`已保存 ${parsed.length} 条自定义词句（仅练自定义）`);
    } else {
      state.wordSource = 'all';
      showToast(`已保存 ${parsed.length} 条自定义词句并融入总词库`);
    }

    state.wordIndex = 0;
    document.getElementById('modalCustom').classList.remove('open');
    renderToolbar();
    pickNextItem(false);
  }

  // ==========================================================================
  // 13. 事件绑定 (Touch, Mouse, PC Physical Keyboard, Controls)
  // ==========================================================================
  function bindEvents() {
    // 顶部音效与震动开关
    dom.btnSound.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      dom.btnSound.classList.toggle('active', sound.enabled);
      dom.btnSound.textContent = sound.enabled ? '🔊 音效' : '🔇 静音';
      if (sound.enabled) sound.playTap(true);
    });

    dom.btnVibrate.addEventListener('click', () => {
      state.vibrateEnabled = !state.vibrateEnabled;
      dom.btnVibrate.classList.toggle('active', state.vibrateEnabled);
      dom.btnVibrate.textContent = state.vibrateEnabled ? '📳 震动' : '📴 无震';
      if (state.vibrateEnabled) triggerHaptic(20);
    });

    // 三大训练模式切换
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const newMode = tab.dataset.mode;
        if (state.mode === newMode) return;

        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (state.mode === 'challenge') {
          clearInterval(state.challengeTimerId);
          state.challengeRunning = false;
        }

        state.mode = newMode;
        state.sessionStartTime = null;
        state.completedHanziCount = 0;
        state.totalKeystrokes = 0;
        state.correctKeystrokes = 0;
        state.streak = 0;

        if (newMode === 'challenge') {
          dom.timerBarWrap.classList.add('visible');
          resetChallengeState();
        } else {
          dom.timerBarWrap.classList.remove('visible');
        }

        renderToolbar();
        pickNextItem(false);
        updateDashboard();
      });
    });

    // 盲打遮罩等级切换
    document.querySelectorAll('.mask-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const lvl = Number(pill.dataset.mask);
        state.maskLevel = lvl;
        document.querySelectorAll('.mask-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        dom.keyboardContainer.classList.remove('kb-mask-1', 'kb-mask-2', 'kb-mask-3');
        dom.keyboardContainer.classList.add(`kb-mask-${lvl}`);
        renderStage();
      });
    });

    // 单手模式切换
    document.querySelectorAll('.ergo-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const hand = pill.dataset.hand;
        state.handMode = hand;
        document.querySelectorAll('.ergo-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        dom.keyboardContainer.classList.remove('hand-left', 'hand-right');
        if (hand === 'left') dom.keyboardContainer.classList.add('hand-left');
        if (hand === 'right') dom.keyboardContainer.classList.add('hand-right');
      });
    });

    // Lv.3 纯盲打按住偷看拼音
    const startPeek = (e) => {
      e.preventDefault();
      state.isPeeking = true;
      renderStage();
    };
    const endPeek = () => {
      if (state.isPeeking) {
        state.isPeeking = false;
        renderStage();
      }
    };
    dom.btnPeekPinyin.addEventListener('pointerdown', startPeek);
    dom.btnPeekPinyin.addEventListener('pointerup', endPeek);
    dom.btnPeekPinyin.addEventListener('pointerleave', endPeek);
    dom.btnPeekPinyin.addEventListener('pointercancel', endPeek);

    // 九宫格键盘 1-9 触屏/鼠标即时响应 (pointerdown 零延迟)
    dom.t9Keys.forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleNineKeyPress(btn.dataset.key);
      });
    });

    // 底部辅助按钮
    document.getElementById('fnSkip').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.playTap(false);
      pickNextItem(true);
    });

    document.getElementById('fnAnchorHint').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.playTap(true);
      triggerHaptic(22);
      highlightTargetHint('5');
      flashRadarCell('5');
      showToast('已定位中心 5 键原点 (JKL)');
    });

    document.getElementById('fnBackspace').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.playTap(false);
      state.charIndex = 0;
      renderStage();
    });

    // 薄弱诊断与弹窗控制
    document.getElementById('btnOpenWeakness').addEventListener('click', openWeaknessModal);

    document.getElementById('btnDrillWeakness').addEventListener('click', () => {
      const topWeak = getTopWeakLetters(3);
      if (topWeak.length === 0) {
        showToast('暂无薄弱记录，先随机练习几组吧！');
        return;
      }
      // 收集易错字母及其同键位字母，组成专项强化池
      const drillSet = new Set();
      topWeak.forEach(w => {
        KEY_MAP[w.key].letters.forEach(ch => drillSet.add(ch));
      });
      state.weakDrillLetters = Array.from(drillSet);
      document.getElementById('modalWeakness').classList.remove('open');

      // 自动切换到锚点模式下的薄弱强化分组
      document.querySelectorAll('.mode-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === 'anchor');
      });
      state.mode = 'anchor';
      state.anchorGroup = 'weakness';
      dom.timerBarWrap.classList.remove('visible');
      renderToolbar();
      pickNextItem(false);
      showToast('已进入薄弱键位专项强化！');
    });

    document.getElementById('btnResetStats').addEventListener('click', () => {
      state.letterStats = {};
      state.weakDrillLetters = [];
      saveLetterStats();
      updateWeaknessSummaryBadge();
      openWeaknessModal();
      showToast('已清空历史错误统计');
    });

    document.getElementById('btnSaveCustomAll').addEventListener('click', () => parseAndSaveCustomWords(false));
    document.getElementById('btnSaveCustomOnly').addEventListener('click', () => parseAndSaveCustomWords(true));

    document.getElementById('btnRestartChallenge').addEventListener('click', () => {
      document.getElementById('modalSummary').classList.remove('open');
      resetChallengeState();
      pickNextItem(false);
    });

    // 弹窗关闭按钮与遮罩点击关闭
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    // 电脑物理键盘映射 (主键盘 1-9 / 小键盘 Numpad1-9 / Backspace / Space)
    window.addEventListener('keydown', (e) => {
      // 如果正在自定义词句文本框中输入，不拦截按键
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // 如果有弹窗打开，按 Escape 关闭
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
        return;
      }

      if (e.repeat) return;

      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        handleNineKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        const fnBtn = document.getElementById('fnBackspace');
        fnBtn.classList.add('is-pressed');
        setTimeout(() => fnBtn.classList.remove('is-pressed'), 130);
        sound.playTap(false);
        state.charIndex = 0;
        renderStage();
      } else if (e.code === 'Space') {
        e.preventDefault();
        const fnBtn = document.getElementById('fnSkip');
        fnBtn.classList.add('is-pressed');
        setTimeout(() => fnBtn.classList.remove('is-pressed'), 130);
        sound.playTap(false);
        pickNextItem(true);
      }
    });
  }

  // ==========================================================================
  // 14. 启动初始化
  // ==========================================================================
  function applyTopSafeInset() {
    if (window.innerWidth >= 480) return;
    function applyValue(px) {
      if (typeof px === 'number' && px > 36) {
        const topPad = Math.ceil(px) + 10;
        document.documentElement.style.setProperty('--xhs-top-inset', topPad + 'px');
        document.documentElement.style.setProperty('--xhs-toast-top', (topPad + 42) + 'px');
      }
    }
    try {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;padding-top:var(--safe-area-inset-top, env(safe-area-inset-top, 0px));visibility:hidden;pointer-events:none;';
      document.body.appendChild(probe);
      const envTop = parseFloat(window.getComputedStyle(probe).paddingTop) || 0;
      document.body.removeChild(probe);
      applyValue(envTop);
    } catch (e) {}
    try {
      const mt = window.xhs && window.xhs.miniTool;
      if (mt && typeof mt.getWindowInfo === 'function') {
        Promise.resolve(mt.getWindowInfo()).then(info => {
          if (!info) return;
          const top = (info.safeArea && info.safeArea.top) || info.statusBarHeight || 0;
          applyValue(top);
        }).catch(() => {});
      }
    } catch (e) {}
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyTopSafeInset();
    loadPersistedData();
    bindEvents();
    renderToolbar();
    pickNextItem(false);
    updateWeaknessSummaryBadge();
    updateDashboard();
  });
