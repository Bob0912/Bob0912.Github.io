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

  const init = () => {
    cleanupLegacyBlocks();
    normalizeRecentPostCards();
    normalizeRelatedCards();
    initReadingProgress();
    initExternalLinks();
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
