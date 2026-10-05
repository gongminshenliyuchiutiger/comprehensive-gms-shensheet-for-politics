/**
 * 公民神會考神融會貫通 - 互動學習單核心邏輯
 * 嚴格遵循繁體中文規範，全面支援 Font Awesome 圖示與響應式互動
 */

document.addEventListener("DOMContentLoaded", () => {
  // 核心狀態管理
  const state = {
    currentUnit: "all",
    answers: {},       // questionId: { isCorrect, userAnswer, completed }
    studentInfo: {
      className: "",
      name: "",
      seatNo: ""
    },
    totalQuestions: 0
  };

  // 讀取本地暫存
  loadSavedState();

  // 初始化 DOM 元素
  const unitNavEl = document.getElementById("unitNav");
  const unitsContainerEl = document.getElementById("unitsContainer");
  const progressBarFillEl = document.getElementById("progressBarFill");
  const progressTextEl = document.getElementById("progressText");
  const scoreValueEl = document.getElementById("scoreValue");
  const completedValueEl = document.getElementById("completedValue");
  const accuracyValueEl = document.getElementById("accuracyValue");

  // 建立各單元題目映射與題庫全集
  const unitQuestionMap = {};
  const allQuestionIds = [];
  let totalQCount = 0;

  STUDY_DATA.units.forEach(u => {
    unitQuestionMap[u.id] = [];
    u.sections.forEach(s => {
      s.questions.forEach(q => {
        unitQuestionMap[u.id].push(q.id);
        allQuestionIds.push(q.id);
        totalQCount++;
      });
    });
  });
  state.totalQuestions = totalQCount;
  const totalCountEl = document.getElementById("totalQuestionsCount");
  if (totalCountEl) totalCountEl.textContent = totalQCount;

  // 渲染單元 Tabs 與內容
  renderUnitTabs();
  renderUnits();
  updateStats();

  // 綁定學生基本資料輸入事件
  setupStudentInfoInputs();

  // 綁定吉祥物自由拖曳與語錄互動
  setupMascot();

  // 綁定列印與重置功能
  setupUtilityButtons();

  /**
   * 渲染單元導覽 Tabs
   */
  function renderUnitTabs() {
    unitNavEl.innerHTML = "";

    // 「全部單元總覽」按鈕
    const allTab = document.createElement("button");
    allTab.className = `unit-tab ${state.currentUnit === "all" ? "active" : ""}`;
    allTab.innerHTML = `<i class="fa-solid fa-layer-group"></i> 全部單元總覽`;
    allTab.onclick = () => switchUnit("all");
    unitNavEl.appendChild(allTab);

    // 各個別單元
    STUDY_DATA.units.forEach(unit => {
      const tab = document.createElement("button");
      tab.className = `unit-tab ${state.currentUnit === unit.id ? "active" : ""}`;
      tab.innerHTML = `<i class="fa-solid ${unit.icon}"></i> ${unit.title}`;
      tab.onclick = () => switchUnit(unit.id);
      unitNavEl.appendChild(tab);
    });
  }

  /**
   * 切換單元視圖（各單元分開獨立計算進度與計分）
   */
  function switchUnit(unitId) {
    state.currentUnit = unitId;
    renderUnitTabs();
    renderUnits();
    updateStats(); // 即時切換計算當前所選單元之完成題數與積分
    window.scrollTo({ top: 380, behavior: "smooth" });
  }

  /**
   * 渲染所有單元或特定單元內容
   */
  function renderUnits() {
    unitsContainerEl.innerHTML = "";

    const unitsToRender = state.currentUnit === "all"
      ? STUDY_DATA.units
      : STUDY_DATA.units.filter(u => u.id === state.currentUnit);

    unitsToRender.forEach(unit => {
      const unitCard = document.createElement("section");
      unitCard.className = "unit-section-card";
      unitCard.id = `card-${unit.id}`;

      // 單元標題列
      let unitHtml = `
        <div class="print-worksheet-header">
          <div class="print-worksheet-title">公民神會考神融會貫通問答系統(政治篇)&nbsp;&nbsp;&nbsp;&nbsp;${unit.title}</div>
          <div class="print-worksheet-meta">
            <span>班級：<span class="meta-fill print-val-class">${state.studentInfo.className || "　　　"}</span></span>
            <span>座號：<span class="meta-fill print-val-seat">${state.studentInfo.seatNo || "　　"}</span></span>
            <span>姓名：<span class="meta-fill print-val-name">${state.studentInfo.name || "　　　"}</span></span>
            <span>得分：<span class="meta-fill">　　　</span></span>
          </div>
        </div>

        <div class="unit-header">
          <div class="unit-title-group">
            <div class="unit-icon-badge">
              <i class="fa-solid ${unit.icon}"></i>
            </div>
            <div class="unit-title-text">
              <div class="unit-series-label"><i class="fa-solid fa-graduation-cap"></i> 公民神會考神融會貫通問答系統(政治篇)</div>
              <h2>${unit.title}</h2>
            </div>
          </div>
          <div class="unit-badge">
            <button class="btn btn-primary btn-play-unit" data-unit-id="${unit.id}" title="從本單元開始播放投影簡報">
              <i class="fa-solid fa-chalkboard-user"></i> 播放本單元簡報
            </button>
            <span class="btn btn-outline" style="cursor: default; font-size: 0.8rem;">
              <i class="fa-solid fa-pen-ruler"></i> 融會貫通互動學習單
            </span>
          </div>
        </div>

        <div class="unit-summary-box">
          <div class="unit-summary-title">
            <i class="fa-solid fa-lightbulb"></i> 會考神融會貫通核心重點精華
          </div>
          <ul class="unit-summary-list">
            ${unit.summary.map(s => `<li>${s}</li>`).join("")}
          </ul>
        </div>
      `;

      // 子章節與題目
      unit.sections.forEach(section => {
        unitHtml += `
          <div class="section-block">
            <div class="section-title">
              <i class="fa-solid fa-bookmark" style="color: var(--primary-color);"></i>
              ${section.title}
            </div>
            <div class="questions-list">
              ${section.questions.map(q => renderQuestionMarkup(q)).join("")}
            </div>
          </div>
        `;
      });

      unitCard.innerHTML = unitHtml;
      unitsContainerEl.appendChild(unitCard);

      // 為剛渲染的題目綁定互動事件與還原狀態
      unit.sections.forEach(section => {
        section.questions.forEach(q => {
          attachQuestionEvents(q);
          restoreQuestionState(q);
        });
      });

      // 綁定本單元卡片的簡報播放按鈕
      unitCard.querySelectorAll(".btn-play-unit").forEach(btn => {
        btn.onclick = () => {
          const uId = btn.getAttribute("data-unit-id");
          openPresentationByUnit(uId);
        };
      });
    });
  }

  /**
   * 產生各題型的 HTML 標記
   */
  function renderQuestionMarkup(q) {
    let badgeClass = "badge-fill";
    let badgeLabel = "填空題";
    let badgeIcon = "fa-pen-to-square";

    if (q.type === "choice") {
      badgeClass = "badge-choice";
      badgeLabel = "單選題";
      badgeIcon = "fa-circle-dot";
    } else if (q.type === "multi") {
      badgeClass = "badge-multi";
      badgeLabel = "多選題";
      badgeIcon = "fa-square-check";
    } else if (q.type === "ox") {
      badgeClass = "badge-ox";
      badgeLabel = "是非判斷";
      badgeIcon = "fa-check-double";
    } else if (q.type === "matching") {
      badgeClass = "badge-matching";
      badgeLabel = "配對題";
      badgeIcon = "fa-arrows-split-up-and-left";
    }

    let interactiveHtml = "";

    // 填空題
    if (q.type === "fill") {
      interactiveHtml = `
        <div class="interactive-fill">
          <input type="text" class="fill-input" id="input-${q.id}" placeholder="${q.prompt || '請輸入作答文字...'}" autocomplete="off">
          <button class="btn btn-primary" id="btn-submit-${q.id}">
            <i class="fa-solid fa-paper-plane"></i> 確認作答
          </button>
        </div>
      `;
    }
    // 單選題
    else if (q.type === "choice") {
      interactiveHtml = `
        <div class="interactive-options" id="options-${q.id}">
          ${q.options.map(opt => `
            <label class="option-label" for="opt-${q.id}-${opt.id}">
              <input type="radio" name="radio-${q.id}" id="opt-${q.id}-${opt.id}" value="${opt.id}">
              <span>${opt.text}</span>
            </label>
          `).join("")}
        </div>
      `;
    }
    // 多選題
    else if (q.type === "multi") {
      interactiveHtml = `
        <div class="interactive-options" id="options-${q.id}">
          ${q.options.map(opt => `
            <label class="option-label" for="chk-${q.id}-${opt.id}">
              <input type="checkbox" name="chk-${q.id}" id="chk-${q.id}-${opt.id}" value="${opt.id}">
              <span>${opt.text}</span>
            </label>
          `).join("")}
        </div>
        <div style="margin-top: 10px;">
          <button class="btn btn-primary" id="btn-submit-${q.id}">
            <i class="fa-solid fa-square-check"></i> 提交多選答案
          </button>
        </div>
      `;
    }
    // 是非題
    else if (q.type === "ox") {
      interactiveHtml = `
        <div class="interactive-ox" id="ox-group-${q.id}">
          <button class="ox-btn o-btn" id="btn-o-${q.id}">
            <i class="fa-solid fa-circle"></i> 正確 (Ｏ)
          </button>
          <button class="ox-btn x-btn" id="btn-x-${q.id}">
            <i class="fa-solid fa-xmark"></i> 錯誤 (Ｘ)
          </button>
        </div>
      `;
    }
    // 配對題
    else if (q.type === "matching") {
      interactiveHtml = `
        <div class="interactive-matching" id="matching-${q.id}">
          ${q.items.map((item, idx) => `
            <div class="matching-row">
              <span class="matching-text"><i class="fa-solid fa-chevron-right" style="color: var(--primary-color); font-size: 0.8rem;"></i> ${item.text}</span>
              <select class="matching-select" data-index="${idx}" id="match-select-${q.id}-${idx}">
                <option value="">-- 請選擇配對類別 --</option>
                ${q.categories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
              </select>
            </div>
          `).join("")}
        </div>
        <div style="margin-top: 12px;">
          <button class="btn btn-primary" id="btn-submit-${q.id}">
            <i class="fa-solid fa-arrow-right-arrow-left"></i> 核對配對
          </button>
        </div>
      `;
    }

    return `
      <div class="question-card" id="card-${q.id}">
        <div class="question-badge ${badgeClass}">
          <i class="fa-solid ${badgeIcon}"></i> ${badgeLabel}
        </div>
        <div class="question-title">
          <span>${q.title}</span>
        </div>
        <div class="question-text">${q.question}</div>
        
        ${interactiveHtml}

        <div class="feedback-box" id="feedback-${q.id}">
          <i class="fa-solid fa-circle-info feedback-icon"></i>
          <span class="feedback-text"></span>
        </div>

        <button class="explanation-toggle" id="exp-toggle-${q.id}">
          <i class="fa-solid fa-brain"></i> 查看神會考解題重點與觀念解析
        </button>
        <div class="explanation-content" id="exp-content-${q.id}">
          <strong><i class="fa-solid fa-graduation-cap"></i> 解析重點：</strong> ${q.explanation}
        </div>
      </div>
    `;
  }

  /**
   * 綁定題目互動事件
   */
  function attachQuestionEvents(q) {
    const cardEl = document.getElementById(`card-${q.id}`);
    const toggleBtn = document.getElementById(`exp-toggle-${q.id}`);
    const expContent = document.getElementById(`exp-content-${q.id}`);

    // 解析切換
    if (toggleBtn && expContent) {
      toggleBtn.onclick = () => {
        expContent.classList.toggle("show");
        toggleBtn.innerHTML = expContent.classList.contains("show")
          ? `<i class="fa-solid fa-chevron-up"></i> 收合解題重點`
          : `<i class="fa-solid fa-brain"></i> 查看神會考解題重點與觀念解析`;
      };
    }

    // 填空題提交
    if (q.type === "fill") {
      const inputEl = document.getElementById(`input-${q.id}`);
      const submitBtn = document.getElementById(`btn-submit-${q.id}`);
      if (inputEl && submitBtn) {
        submitBtn.onclick = () => handleFillSubmit(q);
        inputEl.onkeydown = (e) => {
          if (e.key === "Enter") {
            handleFillSubmit(q);
          }
        };
      }
    }
    // 單選題點擊
    else if (q.type === "choice") {
      const radios = document.querySelectorAll(`input[name="radio-${q.id}"]`);
      radios.forEach(r => {
        r.onchange = () => handleChoiceSubmit(q, r.value);
      });
    }
    // 多選題提交
    else if (q.type === "multi") {
      const submitBtn = document.getElementById(`btn-submit-${q.id}`);
      if (submitBtn) {
        submitBtn.onclick = () => handleMultiSubmit(q);
      }
    }
    // 是非題按鈕
    else if (q.type === "ox") {
      const oBtn = document.getElementById(`btn-o-${q.id}`);
      const xBtn = document.getElementById(`btn-x-${q.id}`);
      if (oBtn && xBtn) {
        oBtn.onclick = () => handleOxSubmit(q, true);
        xBtn.onclick = () => handleOxSubmit(q, false);
      }
    }
    // 配對題提交
    else if (q.type === "matching") {
      const submitBtn = document.getElementById(`btn-submit-${q.id}`);
      if (submitBtn) {
        submitBtn.onclick = () => handleMatchingSubmit(q);
      }
    }
  }

  /**
   * 處理填空題提交
   */
  function handleFillSubmit(q) {
    const inputEl = document.getElementById(`input-${q.id}`);
    const userVal = (inputEl.value || "").trim();

    if (!userVal) {
      showFeedback(q.id, false, "請先輸入您的答案再進行確認喔！");
      return;
    }

    // 模糊寬鬆比對：過濾標點符號與空白
    const cleanUser = userVal.replace(/[\s、，,。.]/g, "").toLowerCase();
    const isCorrect = q.answer.some(ans => {
      const cleanAns = ans.replace(/[\s、，,。.]/g, "").toLowerCase();
      return cleanUser === cleanAns || cleanUser.includes(cleanAns) || cleanAns.includes(cleanUser);
    });

    recordAnswer(q.id, isCorrect, userVal);

    if (isCorrect) {
      showFeedback(q.id, true, `恭喜答對！正確答案為：${q.answer[0]}`);
    } else {
      showFeedback(q.id, false, `答案不完全正確，請再思考看看！可參考下方神解析獲取提示。`);
    }
  }

  /**
   * 處理單選題提交
   */
  function handleChoiceSubmit(q, selectedId) {
    const correctOpt = q.options.find(o => o.correct);
    const isCorrect = correctOpt && correctOpt.id === selectedId;

    recordAnswer(q.id, isCorrect, selectedId);

    if (isCorrect) {
      showFeedback(q.id, true, "回答正確！太優秀了！");
    } else {
      showFeedback(q.id, false, `回答有誤，正確選項為：【${correctOpt.text}】`);
    }
  }

  /**
   * 處理多選題提交
   */
  function handleMultiSubmit(q) {
    const checkboxes = document.querySelectorAll(`input[name="chk-${q.id}"]:checked`);
    const selectedIds = Array.from(checkboxes).map(c => c.value);

    if (selectedIds.length === 0) {
      showFeedback(q.id, false, "請至少勾選一個選項再提交！");
      return;
    }

    const correctIds = q.options.filter(o => o.correct).map(o => o.id);
    const isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every(id => correctIds.includes(id));

    recordAnswer(q.id, isCorrect, selectedIds);

    const correctTextList = q.options.filter(o => o.correct).map(o => o.text).join("、");

    if (isCorrect) {
      showFeedback(q.id, true, `完全正確！正確項目包含：${correctTextList}`);
    } else {
      showFeedback(q.id, false, `勾選有誤或不完整。全對正確項目應為：${correctTextList}`);
    }
  }

  /**
   * 處理是非題提交
   */
  function handleOxSubmit(q, userChoice) {
    const oBtn = document.getElementById(`btn-o-${q.id}`);
    const xBtn = document.getElementById(`btn-x-${q.id}`);

    if (oBtn && xBtn) {
      oBtn.classList.remove("selected");
      xBtn.classList.remove("selected");
      if (userChoice) oBtn.classList.add("selected");
      else xBtn.classList.add("selected");
    }

    const isCorrect = userChoice === q.answer;
    recordAnswer(q.id, isCorrect, userChoice);

    const correctStr = q.answer ? "正確 (Ｏ)" : "錯誤 (Ｘ)";
    if (isCorrect) {
      showFeedback(q.id, true, `判斷正確！本題為：${correctStr}`);
    } else {
      showFeedback(q.id, false, `判斷錯誤！本題應為：${correctStr}`);
    }
  }

  /**
   * 處理配對題提交
   */
  function handleMatchingSubmit(q) {
    let allSelected = true;
    let allMatchCorrect = true;
    const userChoices = [];

    q.items.forEach((item, idx) => {
      const selectEl = document.getElementById(`match-select-${q.id}-${idx}`);
      const val = selectEl.value;
      userChoices.push(val);
      if (!val) {
        allSelected = false;
      }
      if (val !== item.target) {
        allMatchCorrect = false;
      }
    });

    if (!allSelected) {
      showFeedback(q.id, false, "請將所有項目都選擇配對類別後再核對！");
      return;
    }

    recordAnswer(q.id, allMatchCorrect, userChoices);

    if (allMatchCorrect) {
      showFeedback(q.id, true, "全部配對正確！太厲害了，概念融會貫通！");
    } else {
      showFeedback(q.id, false, "部分配對有誤，請點擊下方神解析核對標準觀念後再試一次！");
    }
  }

  /**
   * 顯示題目回饋訊息
   */
  function showFeedback(qid, isCorrect, msg) {
    const fbEl = document.getElementById(`feedback-${qid}`);
    const cardEl = document.getElementById(`card-${qid}`);

    if (!fbEl || !cardEl) return;

    fbEl.className = `feedback-box show ${isCorrect ? "correct" : "incorrect"}`;
    fbEl.querySelector(".feedback-icon").className = isCorrect
      ? "fa-solid fa-circle-check feedback-icon"
      : "fa-solid fa-circle-xmark feedback-icon";
    fbEl.querySelector(".feedback-text").textContent = msg;

    cardEl.classList.remove("correct", "incorrect");
    cardEl.classList.add(isCorrect ? "correct" : "incorrect");
  }

  /**
   * 記錄答題狀態並持久化
   */
  function recordAnswer(qid, isCorrect, userAnswer) {
    state.answers[qid] = {
      isCorrect,
      userAnswer,
      completed: true
    };
    saveState();
    updateStats();
  }

  /**
   * 還原特定題目狀態
   */
  function restoreQuestionState(q) {
    const saved = state.answers[q.id];
    if (!saved) return;

    if (q.type === "fill") {
      const inputEl = document.getElementById(`input-${q.id}`);
      if (inputEl) inputEl.value = saved.userAnswer || "";
    } else if (q.type === "choice") {
      const radio = document.querySelector(`input[name="radio-${q.id}"][value="${saved.userAnswer}"]`);
      if (radio) radio.checked = true;
    } else if (q.type === "multi") {
      if (Array.isArray(saved.userAnswer)) {
        saved.userAnswer.forEach(val => {
          const chk = document.querySelector(`input[name="chk-${q.id}"][value="${val}"]`);
          if (chk) chk.checked = true;
        });
      }
    } else if (q.type === "ox") {
      const oBtn = document.getElementById(`btn-o-${q.id}`);
      const xBtn = document.getElementById(`btn-x-${q.id}`);
      if (oBtn && xBtn) {
        if (saved.userAnswer === true) oBtn.classList.add("selected");
        if (saved.userAnswer === false) xBtn.classList.add("selected");
      }
    } else if (q.type === "matching") {
      if (Array.isArray(saved.userAnswer)) {
        saved.userAnswer.forEach((val, idx) => {
          const selectEl = document.getElementById(`match-select-${q.id}-${idx}`);
          if (selectEl) selectEl.value = val;
        });
      }
    }

    if (saved.completed) {
      const cardEl = document.getElementById(`card-${q.id}`);
      if (cardEl) {
        cardEl.classList.add(saved.isCorrect ? "correct" : "incorrect");
      }
    }
  }

  /**
   * 更新即時統計看板與進度條（依目前選中單元分開獨立計算）
   */
  function updateStats() {
    const isAll = state.currentUnit === "all";
    const curUnit = STUDY_DATA.units.find(u => u.id === state.currentUnit);

    // 決定要統計的題目集與範圍總題數
    const targetQIds = isAll ? allQuestionIds : (unitQuestionMap[state.currentUnit] || []);
    const scopeTotal = targetQIds.length;
    const scopeTitle = isAll ? "全卷總計" : (curUnit ? curUnit.title : "本單元");

    let completedCount = 0;
    let correctCount = 0;

    targetQIds.forEach(qId => {
      const ans = state.answers[qId];
      if (ans && ans.completed) {
        completedCount++;
        if (ans.isCorrect) correctCount++;
      }
    });

    const percent = scopeTotal > 0
      ? Math.round((completedCount / scopeTotal) * 100)
      : 0;

    const accuracy = completedCount > 0
      ? Math.round((correctCount / completedCount) * 100)
      : 0;

    const currentScore = correctCount * 10;
    const maxScore = scopeTotal * 10;

    progressBarFillEl.style.width = `${percent}%`;
    progressTextEl.textContent = `${percent}%`;

    completedValueEl.innerHTML = `${completedCount} / <span>${scopeTotal}</span>`;
    scoreValueEl.textContent = currentScore;
    accuracyValueEl.textContent = `${accuracy}%`;

    // 同步更新標籤說明，讓使用者一眼看懂目前分開計算的單元
    const completedLabelEl = document.getElementById("completedLabel");
    const scoreLabelEl = document.getElementById("scoreLabel");
    const progressTitleEl = document.getElementById("progressTitleText");
    const badgeValueEl = document.getElementById("badgeValue");
    const badgeLabelEl = document.getElementById("badgeLabel");

    if (completedLabelEl) {
      completedLabelEl.textContent = isAll ? "已完成題數 (全卷總計)" : `已完成題數 (${scopeTitle})`;
    }
    if (scoreLabelEl) {
      scoreLabelEl.textContent = isAll ? `全卷累計積分 (滿分 ${maxScore})` : `本單元積分 (滿分 ${maxScore})`;
    }
    if (progressTitleEl) {
      progressTitleEl.textContent = isAll ? "全卷完成進度" : `${scopeTitle} 完成進度`;
    }

    if (badgeValueEl) {
      if (completedCount === 0) {
        badgeValueEl.textContent = "準備啟航";
      } else if (percent === 100 && accuracy === 100) {
        badgeValueEl.textContent = "滿分公民神 A++";
      } else if (percent === 100 && accuracy >= 80) {
        badgeValueEl.textContent = "會考精熟 A+";
      } else if (percent >= 50 && accuracy >= 70) {
        badgeValueEl.textContent = "實力穩健 B++";
      } else {
        badgeValueEl.textContent = "積極鍛鍊中";
      }
    }
    if (badgeLabelEl) {
      badgeLabelEl.textContent = isAll ? "全卷實力階級" : `${scopeTitle} 掌握度`;
    }
  }

  /**
   * 學生資訊管理
   */
  function setupStudentInfoInputs() {
    const classInput = document.getElementById("studentClass");
    const nameInput = document.getElementById("studentName");
    const seatInput = document.getElementById("studentSeat");

    classInput.value = state.studentInfo.className || "";
    nameInput.value = state.studentInfo.name || "";
    seatInput.value = state.studentInfo.seatNo || "";

    const syncPrintMeta = () => {
      document.querySelectorAll(".print-val-class").forEach(el => el.textContent = state.studentInfo.className || "　　　");
      document.querySelectorAll(".print-val-name").forEach(el => el.textContent = state.studentInfo.name || "　　　");
      document.querySelectorAll(".print-val-seat").forEach(el => el.textContent = state.studentInfo.seatNo || "　　");
    };

    const saveInfo = () => {
      state.studentInfo = {
        className: classInput.value.trim(),
        name: nameInput.value.trim(),
        seatNo: seatInput.value.trim()
      };
      saveState();
      syncPrintMeta();
    };

    classInput.oninput = saveInfo;
    nameInput.oninput = saveInfo;
    seatInput.oninput = saveInfo;
    syncPrintMeta();
  }

  /**
   * 吉祥物自由拖曳、霓虹懸停抖動（使用者需求：頭上不跳對話框）
   */
  function setupMascot() {
    const mascot = document.getElementById("mascotContainer");
    if (!mascot) return;

    // 拖曳邏輯（滑鼠與觸控兼用）
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 24;
    let initialTop = window.innerHeight - 200;

    // 還原吉祥物暫存位置
    const savedPos = localStorage.getItem("mascot_pos");
    if (savedPos) {
      try {
        const { left, top } = JSON.parse(savedPos);
        mascot.style.left = `${left}px`;
        mascot.style.top = `${top}px`;
        mascot.style.bottom = "auto";
      } catch (e) { }
    }

    const onDragStart = (clientX, clientY) => {
      isDragging = false;
      startX = clientX;
      startY = clientY;
      const rect = mascot.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
    };

    const onDragMove = (clientX, clientY) => {
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        isDragging = true;
      }

      if (isDragging) {
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const padding = 10;
        const maxLeft = window.innerWidth - mascot.offsetWidth - padding;
        const maxTop = window.innerHeight - mascot.offsetHeight - padding;

        newLeft = Math.max(padding, Math.min(newLeft, maxLeft));
        newTop = Math.max(padding, Math.min(newTop, maxTop));

        mascot.style.left = `${newLeft}px`;
        mascot.style.top = `${newTop}px`;
        mascot.style.bottom = "auto";
      }
    };

    const onDragEnd = () => {
      if (isDragging) {
        const rect = mascot.getBoundingClientRect();
        localStorage.setItem("mascot_pos", JSON.stringify({ left: rect.left, top: rect.top }));
        setTimeout(() => { isDragging = false; }, 50);
      }
    };

    // 滑鼠事件
    mascot.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onDragStart(e.clientX, e.clientY);

      const onMouseMove = (moveEvent) => {
        onDragMove(moveEvent.clientX, moveEvent.clientY);
      };

      const onMouseUp = () => {
        onDragEnd();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    // 觸控事件
    mascot.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        onDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && (isDragging || Math.abs(e.touches[0].clientX - startX) > 4)) {
        onDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      onDragEnd();
    });
  }

  // ===================================================================
  // 課堂簡報展示模式 (Presentation Mode) - 老師教學投影專用
  // ===================================================================
  const presQuestions = [];
  const unitStartIndexMap = {};

  STUDY_DATA.units.forEach(u => {
    unitStartIndexMap[u.id] = presQuestions.length;
    u.sections.forEach(s => {
      s.questions.forEach(q => {
        presQuestions.push({
          ...q,
          unitId: u.id,
          unitTitle: u.title,
          sectionTitle: s.title
        });
      });
    });
  });

  let currentPresIndex = 0;
  let isPresAnswerShown = false;

  const presOverlay = document.getElementById("presentationOverlay");
  const presUnitSelect = document.getElementById("presUnitSelect");
  const presStepBadge = document.getElementById("presStepBadge");
  const presCard = document.getElementById("presCard");
  const presProgressBarFill = document.getElementById("presProgressBarFill");
  const btnPresPrev = document.getElementById("btnPresPrev");
  const btnPresNext = document.getElementById("btnPresNext");
  const btnPresToggleAnswer = document.getElementById("btnPresToggleAnswer");
  const presAnswerBtnText = document.getElementById("presAnswerBtnText");
  const btnPresFullscreen = document.getElementById("btnPresFullscreen");
  const btnPresClose = document.getElementById("btnPresClose");
  const btnPresentation = document.getElementById("btnPresentation");

  // 初始化簡報模式單元下拉跳轉選單
  if (presUnitSelect) {
    presUnitSelect.innerHTML = STUDY_DATA.units.map(u => {
      const idx = unitStartIndexMap[u.id];
      return `<option value="${idx}">${u.title}</option>`;
    }).join("");

    presUnitSelect.onchange = () => {
      const targetIndex = parseInt(presUnitSelect.value, 10) || 0;
      currentPresIndex = targetIndex;
      renderPresSlide(targetIndex);
    };
  }

  // 頂部導航列簡報模式按鈕：從目前所選單元或第一題開始播放
  if (btnPresentation) {
    btnPresentation.onclick = () => {
      if (state.currentUnit && state.currentUnit !== "all") {
        openPresentationByUnit(state.currentUnit);
      } else {
        openPresentation(0);
      }
    };
  }

  function openPresentationByUnit(unitId) {
    const idx = unitStartIndexMap[unitId] !== undefined ? unitStartIndexMap[unitId] : 0;
    openPresentation(idx);
  }

  function openPresentation(index = 0) {
    currentPresIndex = Math.max(0, Math.min(index, presQuestions.length - 1));
    isPresAnswerShown = false;
    presOverlay.classList.add("active");
    renderPresSlide(currentPresIndex);
    document.body.style.overflow = "hidden";
  }

  function closePresentation() {
    presOverlay.classList.remove("active");
    document.body.style.overflow = "";
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function renderPresSlide(index) {
    if (index < 0 || index >= presQuestions.length) return;
    currentPresIndex = index;
    const q = presQuestions[index];
    if (!q) return;

    isPresAnswerShown = false;
    updatePresAnswerButton();

    if (presUnitSelect) {
      const curUnitFirstIndex = unitStartIndexMap[q.unitId];
      if (curUnitFirstIndex !== undefined) {
        presUnitSelect.value = curUnitFirstIndex;
      }
    }

    presStepBadge.textContent = `第 ${index + 1} / ${presQuestions.length} 題`;

    const progressPct = ((index + 1) / presQuestions.length) * 100;
    presProgressBarFill.style.width = `${progressPct}%`;

    btnPresPrev.disabled = index === 0;
    btnPresNext.disabled = index === presQuestions.length - 1;

    let badgeClass = "badge-fill";
    let badgeText = "填空題";
    if (q.type === "choice") { badgeClass = "badge-choice"; badgeText = "單選題"; }
    else if (q.type === "multi") { badgeClass = "badge-multi"; badgeText = "多選題"; }
    else if (q.type === "ox") { badgeClass = "badge-ox"; badgeText = "是非題"; }
    else if (q.type === "matching") { badgeClass = "badge-matching"; badgeText = "配對題"; }

    let optionsMarkup = "";

    if (q.type === "choice" || q.type === "multi") {
      optionsMarkup = `
        <div class="pres-options-list">
          ${q.options.map(opt => `
            <div class="pres-option-item" data-opt-id="${opt.id}" data-correct="${opt.correct}">
              <i class="fa-regular fa-circle-dot"></i>
              <span>${opt.text}</span>
            </div>
          `).join("")}
        </div>
      `;
    } else if (q.type === "ox") {
      optionsMarkup = `
        <div class="pres-options-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="pres-option-item" data-ox="true" data-correct="${q.answer === true}">
            <i class="fa-solid fa-circle" style="color: #34d399;"></i>
            <span>正確 (Ｏ)</span>
          </div>
          <div class="pres-option-item" data-ox="false" data-correct="${q.answer === false}">
            <i class="fa-solid fa-xmark" style="color: #f87171;"></i>
            <span>錯誤 (Ｘ)</span>
          </div>
        </div>
      `;
    } else if (q.type === "matching") {
      optionsMarkup = `
        <div class="pres-options-list">
          ${q.items.map(item => `
            <div class="pres-option-item pres-match-item">
              <i class="fa-solid fa-arrow-right" style="color: #38bdf8;"></i>
              <span style="flex:1;">${item.text}</span>
              <span class="pres-match-placeholder" style="color: #64748b; font-weight: bold;">【？】</span>
              <span class="pres-match-target" style="display: none; color: #34d399; font-weight: bold;">【${item.target}】</span>
            </div>
          `).join("")}
        </div>
      `;
    } else if (q.type === "fill") {
      optionsMarkup = `
        <div style="background: rgba(0,0,0,0.25); border: 1px dashed rgba(255,255,255,0.2); border-radius: var(--radius-md); padding: 18px 24px; margin-bottom: 24px; font-size: 1.25rem; color: #94a3b8;">
          <i class="fa-solid fa-pen-nib" style="color: #38bdf8;"></i> ${q.prompt || '請學生思考並回答答案'}
        </div>
      `;
    }

    let answerContent = "";
    if (q.type === "fill") {
      answerContent = `標準答案：<span style="color: #34d399; font-size: 1.35rem;">${q.answer[0]}</span>`;
    } else if (q.type === "choice") {
      const correct = q.options.find(o => o.correct);
      answerContent = `正確選項：<span style="color: #34d399; font-size: 1.35rem;">${correct ? correct.text : ''}</span>`;
    } else if (q.type === "multi") {
      const correctList = q.options.filter(o => o.correct).map(o => o.text).join("、");
      answerContent = `正確項目：<span style="color: #34d399; font-size: 1.35rem;">${correctList}</span>`;
    } else if (q.type === "ox") {
      answerContent = `判斷結果：<span style="color: #34d399; font-size: 1.35rem;">${q.answer ? "正確 (Ｏ)" : "錯誤 (Ｘ)"}</span>`;
    } else if (q.type === "matching") {
      answerContent = `配對成果如上方綠色標記所示`;
    }

    presCard.innerHTML = `
      <div class="pres-q-header">
        <span class="pres-q-type"><i class="fa-solid fa-tag"></i> ${badgeText}</span>
        <span style="font-size: 1rem; color: #94a3b8;"><i class="fa-solid fa-bookmark"></i> ${q.sectionTitle}</span>
      </div>
      <h2 class="pres-q-title">${q.title}</h2>
      <div class="pres-q-text">${q.question}</div>

      ${optionsMarkup}

      <div class="pres-answer-box" id="presAnswerBox">
        <div class="pres-answer-title">
          <i class="fa-solid fa-circle-check"></i> 標準解答與教學重點
        </div>
        <div class="pres-answer-content">${answerContent}</div>
        <div class="pres-explanation-text">
          <strong style="color: #e2e8f0;"><i class="fa-solid fa-lightbulb"></i> 會考神解析：</strong> ${q.explanation}
        </div>
      </div>
    `;

    // 支援投影時點擊選項即時展示對錯（僅對選擇題與是非題生效）
    presCard.querySelectorAll(".pres-option-item[data-correct]").forEach(item => {
      item.onclick = () => {
        const isCorrect = item.getAttribute("data-correct") === "true";
        if (isCorrect) {
          item.classList.add("correct-ans");
        } else {
          item.style.borderColor = "#ef4444";
          item.style.background = "#7f1d1d";
        }
      };
    });
  }

  function togglePresAnswer() {
    isPresAnswerShown = !isPresAnswerShown;
    const box = document.getElementById("presAnswerBox");
    if (box) {
      if (isPresAnswerShown) {
        box.classList.add("show");
        // 同時高亮所有正確選項
        presCard.querySelectorAll(".pres-option-item[data-correct='true']").forEach(el => el.classList.add("correct-ans"));
        // 揭曉配對題答案
        presCard.querySelectorAll(".pres-match-placeholder").forEach(el => el.style.display = "none");
        presCard.querySelectorAll(".pres-match-target").forEach(el => el.style.display = "inline-block");
      } else {
        box.classList.remove("show");
        presCard.querySelectorAll(".pres-option-item[data-correct='true']").forEach(el => el.classList.remove("correct-ans"));
        presCard.querySelectorAll(".pres-match-placeholder").forEach(el => el.style.display = "inline-block");
        presCard.querySelectorAll(".pres-match-target").forEach(el => el.style.display = "none");
      }
    }
    updatePresAnswerButton();
  }

  function updatePresAnswerButton() {
    if (isPresAnswerShown) {
      btnPresToggleAnswer.innerHTML = `<i class="fa-solid fa-eye-slash"></i> <span id="presAnswerBtnText">隱藏答案</span>`;
    } else {
      btnPresToggleAnswer.innerHTML = `<i class="fa-solid fa-eye"></i> <span id="presAnswerBtnText">揭曉答案</span>`;
    }
  }

  // 簡報控制按鈕事件
  if (btnPresPrev) {
    btnPresPrev.onclick = () => {
      if (currentPresIndex > 0) {
        renderPresSlide(currentPresIndex - 1);
      }
    };
  }

  if (btnPresNext) {
    btnPresNext.onclick = () => {
      if (currentPresIndex < presQuestions.length - 1) {
        renderPresSlide(currentPresIndex + 1);
      }
    };
  }

  if (btnPresToggleAnswer) {
    btnPresToggleAnswer.onclick = togglePresAnswer;
  }

  if (btnPresClose) {
    btnPresClose.onclick = closePresentation;
  }

  if (btnPresFullscreen) {
    btnPresFullscreen.onclick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };
  }

  // 鍵盤投影片快速鍵 (←、→、Space、F、Esc)
  window.addEventListener("keydown", (e) => {
    if (!presOverlay.classList.contains("active")) return;

    if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      if (currentPresIndex > 0) {
        renderPresSlide(currentPresIndex - 1);
      }
    } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "Enter") {
      e.preventDefault();
      if (currentPresIndex < presQuestions.length - 1) {
        renderPresSlide(currentPresIndex + 1);
      }
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      togglePresAnswer();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else if (e.key === "Escape") {
      closePresentation();
    }
  });

  /**
   * 工具列功能：重設學習單與列印學習成果
   */
  function setupUtilityButtons() {
    const resetBtn = document.getElementById("btnReset");
    const printBtn = document.getElementById("btnPrint");

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm("確定要重設所有作答進度嗎？所有填寫的答案將被清空。")) {
          state.answers = {};
          saveState();
          renderUnits();
          updateStats();
          alert("已重設作答進度，祝您學習愉快！");
        }
      };
    }

    if (printBtn) {
      printBtn.onclick = () => {
        // 列印前展開所有解析方便複習檢視
        document.querySelectorAll(".explanation-content").forEach(el => el.classList.add("show"));
        window.print();
      };
    }
  }

  /**
   * 保存與載入狀態到 LocalStorage
   */
  function saveState() {
    localStorage.setItem("civics_study_state", JSON.stringify({
      answers: state.answers,
      studentInfo: state.studentInfo
    }));
  }

  function loadSavedState() {
    const raw = localStorage.getItem("civics_study_state");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.answers) state.answers = parsed.answers;
        if (parsed.studentInfo) state.studentInfo = parsed.studentInfo;
      } catch (e) {
        console.error("載入本機狀態失敗:", e);
      }
    }
  }
});
