(function () {
  const tabs = document.querySelectorAll("nav.tabs button");
  const pageDropdown = document.getElementById("pageDropdown");
  const pageDropdownTrigger = document.getElementById(
    "pageDropdownTrigger",
  );
  const pageDropdownLabel = document.getElementById("pageDropdownLabel");
  const pageDropdownList = document.getElementById("pageDropdownList");
  const pageDropdownItems = document.querySelectorAll(
    ".page-dropdown-list li",
  );
  const sheets = document.querySelectorAll(".sheet");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const curNum = document.getElementById("curNum");
  const dotsWrap = document.getElementById("dots");
  let current = 0;
  const total = sheets.length;

  for (let i = 0; i < total; i++) {
    const d = document.createElement("span");
    if (i === 0) d.classList.add("active");
    dotsWrap.appendChild(d);
  }
  const dots = dotsWrap.querySelectorAll("span");

  function render(index) {
    sheets[current].classList.remove("active");
    sheets[index].classList.add("active");

    tabs.forEach((t) => t.classList.remove("active"));
    tabs[index].classList.add("active");

    pageDropdownItems.forEach((li) => li.classList.remove("current"));
    pageDropdownItems[index].classList.add("current");
    pageDropdownLabel.textContent =
      pageDropdownItems[index].getAttribute("data-label");

    dots.forEach((d) => d.classList.remove("active"));
    dots[index].classList.add("active");

    current = index;
    curNum.textContent = String(index + 1).padStart(2, "0");
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

    tabs[index].scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }

  function goTo(index) {
    if (index < 0 || index >= total || index === current) return;
    render(index);
    // 同步更新網址 #hash（不增加瀏覽紀錄）
    history.replaceState(null, "", "#" + pageHashes[index]);
  }

  tabs.forEach((tab, i) => tab.addEventListener("click", () => goTo(i)));

  function openPageDropdown() {
    pageDropdown.classList.add("open");
    pageDropdownTrigger.setAttribute("aria-expanded", "true");
  }
  function closePageDropdown() {
    pageDropdown.classList.remove("open");
    pageDropdownTrigger.setAttribute("aria-expanded", "false");
  }
  pageDropdownTrigger.addEventListener("click", () => {
    if (pageDropdown.classList.contains("open")) closePageDropdown();
    else openPageDropdown();
  });
  pageDropdownItems.forEach((li) => {
    const i = parseInt(li.getAttribute("data-page"), 10);
    li.addEventListener("click", () => {
      goTo(i);
      closePageDropdown();
    });
  });
  document.addEventListener("click", (e) => {
    if (!pageDropdown.contains(e.target)) closePageDropdown();
  });
  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePageDropdown();
    if (e.key === "ArrowRight") goTo(current + 1);
    if (e.key === "ArrowLeft") goTo(current - 1);
  });
  prevBtn.disabled = true;

  // ===== 網址 #hash 對應分頁 =====
  const pageHashes = [
    "about",      // 01 個人簡介
    "bio",        // 02 自傳
    "skills",     // 03 技能
    "certs",      // 04 證照
    "experience", // 05 經歷
    "projects",   // 06 專案
    "contact",    // 07 聯絡
  ];
  // 別名：輸入這些也能對應到分頁（一律不分大小寫）
  const hashAliases = {
    profile: 0, intro: 0,
    autobiography: 1,
    skill: 2,
    cert: 3, certificate: 3, certificates: 3,
    work: 4, exp: 4,
    project: 5,
  };

  function hashToIndex(hash) {
    const key = decodeURIComponent(hash.replace(/^#/, "")).trim().toLowerCase();
    if (!key) return -1;
    const i = pageHashes.indexOf(key);
    if (i !== -1) return i;
    return key in hashAliases ? hashAliases[key] : -1;
  }

  function applyHash() {
    const i = hashToIndex(location.hash);
    if (i !== -1 && i !== current) render(i);
  }

  window.addEventListener("hashchange", applyHash);
  applyHash(); // 載入時依網址開啟對應分頁

  // ===== Skill star diagram =====
  const skillNodes = document.querySelectorAll(".skill-node");
  const spokes = document.querySelectorAll(".spoke");
  const detailItems = document.querySelectorAll(".skill-detail-item");
  const detailHint = document.getElementById("skillDetailHint");

  function animateCount(el, target, duration) {
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(p * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function selectSkill(name) {
    skillNodes.forEach((n) => {
      const isMatch = n.getAttribute("data-skill") === name;
      n.classList.toggle("active", isMatch);
      n.setAttribute("aria-expanded", isMatch ? "true" : "false");
    });
    spokes.forEach((s) =>
      s.classList.toggle("active", s.getAttribute("data-skill") === name),
    );
    detailItems.forEach((d) =>
      d.classList.toggle("active", d.getAttribute("data-skill") === name),
    );
    if (detailHint) detailHint.style.display = "none";

    const activeItem = document.querySelector(
      '.skill-detail-item[data-skill="' + name + '"]',
    );
    if (activeItem) {
      const fill = activeItem.querySelector(".prof-bar-fill");
      const countEl = activeItem.querySelector(".prof-count");
      if (fill) {
        const target = parseFloat(fill.getAttribute("data-target")) || 0;
        fill.style.width = "0%";
        void fill.offsetWidth; // 強制重繪以重新觸發動畫
        requestAnimationFrame(() => {
          fill.style.width = target + "%";
        });
        if (countEl) animateCount(countEl, target, 900);
      }
    }
  }

  skillNodes.forEach((node) => {
    const name = node.getAttribute("data-skill");
    node.addEventListener("click", () => selectSkill(name));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectSkill(name);
      }
    });
  });
  // ===== 程式碼區塊：簡易上色 + 複製 =====
  const KEYWORDS = new Set(
    (
      "var let const function return if else for foreach while try catch finally " +
      "using new public private static void string int bool out def import from as in " +
      "with await async true false null none class throw except raise continue break " +
      "merge using on when matched then not update set insert values select where and or"
    ).split(" "),
  );
  const TOKEN_RE =
    /(\/\/.*|#.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b([A-Za-z_]\w*)\b/g;

  function escHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlight(src) {
    let out = "";
    let last = 0;
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src))) {
      out += escHtml(src.slice(last, m.index));
      if (m[1]) out += '<span class="tk-c">' + escHtml(m[1]) + "</span>";
      else if (m[2])
        out += '<span class="tk-s">' + escHtml(m[2]) + "</span>";
      else if (KEYWORDS.has(m[3].toLowerCase()))
        out += '<span class="tk-k">' + escHtml(m[3]) + "</span>";
      else out += escHtml(m[3]);
      last = TOKEN_RE.lastIndex;
    }
    return out + escHtml(src.slice(last));
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // 備援：本機直接開檔（file://）或非 https 時使用
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }
  // ===== 專案詳細面板（與技能點擊相同的方式）=====
  const projectCards = document.querySelectorAll(".project-grid .card");
  const projectBody = document.getElementById("projectDetailBody");
  const projectHint = document.getElementById("projectHint");
  let currentProject = null;

  function clearProject() {
    projectCards.forEach((c) => {
      c.classList.remove("active");
      c.setAttribute("aria-expanded", "false");
    });
    projectBody.innerHTML = "";
    if (projectHint) projectHint.style.display = "";
    currentProject = null;
  }

  function selectProject(card) {
    const name = card.dataset.project;
    if (!name) return;

    // 再點一次同一張 → 收合
    if (currentProject === name) {
      clearProject();
      return;
    }

    const detail = document.getElementById("detail-" + name);
    if (!detail) return;

    projectCards.forEach((c) => {
      const isMatch = c === card;
      c.classList.toggle("active", isMatch);
      c.setAttribute("aria-expanded", isMatch ? "true" : "false");
    });

    if (projectHint) projectHint.style.display = "none";

    // 每次建立新的容器，讓進場動畫重新播放
    const wrap = document.createElement("div");
    wrap.className = "pd-item";

    const head = document.createElement("div");
    head.className = "pd-head";
    const tag = document.createElement("div");
    tag.className = "pd-tag";
    tag.textContent = card.querySelector(".tag").textContent;
    const title = document.createElement("h3");
    title.textContent = card.querySelector("h3").textContent;
    head.appendChild(tag);
    head.appendChild(title);

    const content = document.createElement("div");
    content.innerHTML = detail.innerHTML;
    content.querySelectorAll(".code-block code").forEach((c) => {
      c.innerHTML = highlight(c.textContent);
    });

    wrap.appendChild(head);
    wrap.appendChild(content);
    projectBody.innerHTML = "";
    projectBody.appendChild(wrap);

    currentProject = name;
    projectBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  projectCards.forEach((card) => {
    card.addEventListener("click", () => selectProject(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectProject(card);
      }
    });
  });
  projectBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const code = btn.closest(".code-block").querySelector("code");
    copyText(code.textContent)
      .then(() => {
        btn.textContent = "COPIED ✓";
        btn.classList.add("copied");
      })
      .catch(() => {
        btn.textContent = "FAILED";
      })
      .finally(() => {
        clearTimeout(btn._t);
        btn._t = setTimeout(() => {
          btn.textContent = "COPY";
          btn.classList.remove("copied");
        }, 1600);
      });
  });

  // 程式碼分頁切換（內容是動態複製進面板的，所以用事件委派）
  projectBody.addEventListener("click", (e) => {
    const tab = e.target.closest(".code-tabs button");
    if (!tab) return;
    const col = tab.closest(".code-col");
    const idx = Array.prototype.indexOf.call(
      tab.parentElement.children,
      tab,
    );
    col
      .querySelectorAll(".code-tabs button")
      .forEach((b, i) => b.classList.toggle("on", i === idx));
    col
      .querySelectorAll(".code-panel")
      .forEach((p, i) => p.classList.toggle("on", i === idx));
  });

  // 切換到其他分頁時收合，回來時是乾淨狀態
  tabs.forEach((tab) => tab.addEventListener("click", clearProject));
  pageDropdownItems.forEach((li) =>
    li.addEventListener("click", clearProject),
  );
  prevBtn.addEventListener("click", clearProject);
  nextBtn.addEventListener("click", clearProject);
})();
