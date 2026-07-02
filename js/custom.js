(() => {
  const CARD_FALLBACK = {
    编程: "整理技术实践、踩坑经验和工具使用，让内容更适合快速检索与回看。",
    Python: "围绕 Python 学习与实践展开，适合按主题连续阅读。",
    Java: "记录 Java 入门、语法和工程实践中的关键知识点。",
    C语言: "以刷题、基础语法和常见解法为主，适合打基础和复习。",
    投资理财: "从认知、方法到案例，尝试把复杂概念讲得更清楚一些。",
    生活随笔: "写给当下的想法、经历与阶段性总结。"
  };

  const dedupeSegments = raw => {
    const segments = raw
      .split(/(?<=[。！？!?])/)
      .map(item => item.trim())
      .filter(Boolean);

    const result = [];
    for (const segment of segments) {
      if (segment === result[result.length - 1]) continue;
      if (segment.length > 14 && result.includes(segment)) continue;
      result.push(segment);
    }
    return result.join("");
  };

  const cleanSnippet = raw => {
    if (!raw) return "";

    const normalized = raw
      .replace(/原创\s*Bob来啦\s*/gi, " ")
      .replace(/Bob来啦\s*/gi, " ")
      .replace(/小编来无套路分享[^。！？!\n]*[。！？!]?/g, " ")
      .replace(/每日一句[:：]?/g, " ")
      .replace(/欢迎来到[^。！？!\n]*[。！？!]?/g, " ")
      .replace(/点击.*?关注[^。！？!\n]*[。！？!]?/g, " ")
      .replace(/公众号[:：][^。！？!\n]*/g, " ")
      .replace(/阅读原文/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return dedupeSegments(normalized).replace(/\s+/g, " ").trim();
  };

  const clampText = (raw, length = 86) => {
    if (!raw) return "";
    if (raw.length <= length) return raw;
    return `${raw.slice(0, length).trim()}...`;
  };

  const cleanupLegacyBlocks = () => {
    document.querySelector(".home-spotlight")?.remove();
    document.querySelector(".home-filter-panel")?.remove();
    document.querySelector(".page-summary-card")?.remove();
    document.querySelector(".post-insight-card")?.remove();
    document.querySelectorAll(".recent-post-item.is-hidden").forEach(item => item.classList.remove("is-hidden"));
  };

  const tidyHomepageDates = () => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const isHomeFirstPage = path === "/";
    if (!isHomeFirstPage) return;

    document.querySelectorAll("#recent-posts .recent-post-item").forEach(card => {
      const time = card.querySelector(".post-meta-date time");
      const year = Number(time?.dateTime?.slice(0, 4) || time?.textContent?.slice(0, 4));
      if (year >= 2026) card.classList.add("is-homepage-muted");
    });
  };

  const normalizeRecentPostCards = () => {
    document.querySelectorAll(".recent-post-item").forEach(card => {
      const content = card.querySelector(".content");
      if (!content) return;

      const category =
        card.querySelector(".article-meta__categories:last-of-type")?.textContent?.trim() ||
        card.querySelector(".article-meta__categories")?.textContent?.trim() ||
        "";

      const cleaned = clampText(cleanSnippet(content.textContent || ""));
      const fallback = CARD_FALLBACK[category] || `收录在「${category || "博客"}」栏目，继续阅读全文查看完整内容。`;

      content.textContent = cleaned || fallback;
      card.dataset.category = category || "未分类";
    });
  };

  const normalizeRelatedCards = () => {
    document.querySelectorAll(".relatedPosts .pagination-related .info-2 .info-item-1").forEach(node => {
      const cleaned = clampText(cleanSnippet(node.textContent || ""), 92);
      if (cleaned) node.textContent = cleaned;
    });
  };

  const initReadingProgress = () => {
    let bar = document.querySelector(".reading-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "reading-progress";
      document.body.appendChild(bar);
    }

    const article = document.querySelector("#article-container");
    if (!article) {
      bar.style.width = "0%";
      bar.classList.add("is-hidden");
      return;
    }

    const update = () => {
      const rect = article.getBoundingClientRect();
      const start = window.scrollY + rect.top - 120;
      const end = start + article.offsetHeight - window.innerHeight * 0.6;
      const progress = ((window.scrollY - start) / Math.max(1, end - start)) * 100;
      const value = Math.max(0, Math.min(100, progress));
      bar.style.width = `${value}%`;
      bar.classList.remove("is-hidden");
    };

    update();
    window.removeEventListener("scroll", window.__blogProgressHandler || (() => {}));
    window.__blogProgressHandler = update;
    window.addEventListener("scroll", update, { passive: true });
  };

  const initExternalLinks = () => {
    document.querySelectorAll("#article-container a[href^='http']").forEach(link => {
      if (link.dataset.externalEnhanced === "true") return;
      link.dataset.externalEnhanced = "true";
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
      link.classList.add("external-link");
    });
  };

  const syncPageClass = () => {
    document.body.classList.remove("page-shuoshuo", "page-music", "page-link");
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path === "/shuoshuo") document.body.classList.add("page-shuoshuo");
    if (path === "/music") document.body.classList.add("page-music");
    if (path === "/link") document.body.classList.add("page-link");
  };

  const initTechSky = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let canvas = document.querySelector(".tech-sky");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "tech-sky";
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = window.__blogTechSky || {};
    if (state.frame) cancelAnimationFrame(state.frame);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const count = window.innerWidth < 768 ? 28 : 54;
    const points = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.5 + 0.6
    }));

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const dark = document.documentElement.dataset.theme === "dark";
      const dot = dark ? "rgba(98, 232, 255, 0.62)" : "rgba(36, 102, 155, 0.42)";
      const line = dark ? "rgba(98, 232, 255, 0.12)" : "rgba(36, 102, 155, 0.1)";

      points.forEach((point, index) => {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < -20) point.x = window.innerWidth + 20;
        if (point.x > window.innerWidth + 20) point.x = -20;
        if (point.y < -20) point.y = window.innerHeight + 20;
        if (point.y > window.innerHeight + 20) point.y = -20;

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fillStyle = dot;
        ctx.fill();

        for (let i = index + 1; i < points.length; i += 1) {
          const other = points[i];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > 132) continue;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = line;
          ctx.globalAlpha = 1 - distance / 132;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      state.frame = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.removeEventListener("resize", window.__blogTechSkyResize || (() => {}));
    window.__blogTechSkyResize = resize;
    window.addEventListener("resize", resize, { passive: true });
    window.__blogTechSky = state;
  };

  const showToast = message => {
    let toast = document.querySelector(".copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "copy-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(window.__blogToastTimer);
    window.__blogToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  };

  const initCopyFeedback = () => {
    document.querySelectorAll(".copy-button, .copy-btn, .highlight-tools .copy").forEach(button => {
      if (button.dataset.copyFeedback === "true") return;
      button.dataset.copyFeedback = "true";
      button.addEventListener("click", () => showToast("代码已复制，可以直接去试试。"));
    });
  };

  const initClickWords = () => {
    if (window.__blogClickWordsReady) return;
    window.__blogClickWordsReady = true;
    const words = ["Keep coding", "Keep reading", "Keep shipping"];
    let index = 0;

    document.addEventListener("click", event => {
      const target = event.target;
      if (target?.closest?.("a, button, input, textarea, select, .aplayer")) return;

      const word = document.createElement("span");
      word.textContent = words[index % words.length];
      index += 1;
      Object.assign(word.style, {
        position: "fixed",
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        zIndex: 1003,
        color: "var(--bob-cyan)",
        fontWeight: "800",
        fontSize: "14px",
        pointerEvents: "none",
        textShadow: "0 0 14px rgba(33, 212, 253, 0.38)",
        transform: "translate(-50%, -50%)",
        transition: "opacity 0.8s ease, transform 0.8s ease"
      });
      document.body.appendChild(word);
      requestAnimationFrame(() => {
        word.style.opacity = "0";
        word.style.transform = "translate(-50%, -120%)";
      });
      setTimeout(() => word.remove(), 850);
    });
  };

  const enhanceEmptyPages = () => {
    const page = document.querySelector("#page #article-container");
    if (!page || page.dataset.emptyEnhanced === "true") return;

    const path = window.location.pathname.replace(/\/+$/, "");
    const hasBodyText = page.textContent.trim().length > 18;
    const hasWidget = page.querySelector("meting-js, .aplayer, .flink, .tag-cloud-list, .category-lists, #category, #tag");

    if (path === "/shuoshuo" && !hasBodyText) {
      page.insertAdjacentHTML(
        "afterbegin",
        `<div class="empty-page-panel">
          <h2>最近动态</h2>
          <p>这里会放一些阶段性的学习记录、博客维护进度和日常碎片。</p>
          <p>如果暂时没有更多内容，可以先从首页继续翻文章。</p>
        </div>`
      );
      page.dataset.emptyEnhanced = "true";
      return;
    }

    if (path === "/music" && !page.querySelector(".music-page-note")) {
      page.insertAdjacentHTML(
        "beforeend",
        `<div class="music-page-note">音乐组件依赖外部平台加载，如果播放器没有出现，通常是网络或平台接口暂时不可用。</div>`
      );
      page.dataset.emptyEnhanced = "true";
      return;
    }

    if (!hasBodyText && !hasWidget) {
      page.insertAdjacentHTML(
        "afterbegin",
        `<div class="empty-page-panel">
          <h2>内容正在整理中</h2>
          <p>这个页面已经接入站点样式，后续可以继续补充更完整的内容。</p>
        </div>`
      );
      page.dataset.emptyEnhanced = "true";
    }
  };

  const init = () => {
    syncPageClass();
    cleanupLegacyBlocks();
    tidyHomepageDates();
    normalizeRecentPostCards();
    normalizeRelatedCards();
    initReadingProgress();
    initExternalLinks();
    initTechSky();
    initCopyFeedback();
    initClickWords();
    enhanceEmptyPages();
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
