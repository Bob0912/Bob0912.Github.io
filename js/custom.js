(() => {
  const CARD_FALLBACK = {
    编程: "整理技术实践、踩坑经验和工具使用，让内容更适合快速检索与回看。",
    Python: "围绕 Python 学习与实践展开，适合按主题连续阅读。",
    Java: "记录 Java 入门、语法和工程实践中的关键知识点。",
    C语言: "以刷题、基础语法和常见解法为主，适合打基础和复习。",
    投资理财: "从认知、方法到案例，尝试把复杂概念讲得更清楚一些。",
    生活随笔: "写给当下的想法、经历与阶段性总结。"
  };

  const text = (selector, scope = document) => scope.querySelector(selector)?.textContent?.trim() || "";

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

  const createElement = (tag, className, html) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (html !== undefined) element.innerHTML = html;
    return element;
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

  const initHomeSpotlight = () => {
    document.querySelector(".home-spotlight")?.remove();
  };

  const initHomeFilters = () => {
    document.querySelector(".home-filter-panel")?.remove();
    document.querySelectorAll(".recent-post-item.is-hidden").forEach(item => item.classList.remove("is-hidden"));
  };

  const initPageSummary = () => {
    const page = document.querySelector("#page");
    if (!page) return;

    page.querySelector(".page-summary-card")?.remove();

    if (document.querySelector(".tag-cloud-tags")) {
      const tagLinks = Array.from(document.querySelectorAll(".tag-cloud-tags a"));
      const summary = createElement(
        "section",
        "page-summary-card",
        `
          <div>
            <span class="eyebrow">TAG MAP</span>
            <h2>按标签快速找到同主题内容</h2>
            <p>适合从一个具体话题切入，连续阅读相关笔记。</p>
          </div>
          <div class="summary-metrics">
            <div><span>标签数量</span><strong>${tagLinks.length}</strong></div>
            <div><span>高频标签</span><strong>${tagLinks.slice(0, 3).map(link => link.textContent?.trim()).join(" / ")}</strong></div>
          </div>
        `
      );
      page.insertBefore(summary, page.firstChild);
    }

    if (document.querySelector(".category-lists")) {
      const categories = Array.from(document.querySelectorAll(".category-list > .category-list-item"));
      const summary = createElement(
        "section",
        "page-summary-card",
        `
          <div>
            <span class="eyebrow">CATEGORY MAP</span>
            <h2>按内容结构浏览整站文章</h2>
            <p>如果你更偏向系统阅读，分类页会比时间归档更高效。</p>
          </div>
          <div class="summary-metrics">
            <div><span>一级分类</span><strong>${categories.length}</strong></div>
            <div><span>内容主轴</span><strong>编程 / 生活 / 阅读 / 理财</strong></div>
          </div>
        `
      );
      page.insertBefore(summary, page.firstChild);
    }
  };

  const initPostInsights = () => {
    const post = document.querySelector("#post");
    const article = document.querySelector("#article-container");
    if (!post || !article) return;

    post.querySelector(".post-insight-card")?.remove();

    const headings = article.querySelectorAll("h1, h2, h3").length;
    const readTime = text(".post-meta-wordcount span:last-child");
    const categories = Array.from(document.querySelectorAll(".post-meta-categories")).map(item => item.textContent?.trim()).filter(Boolean);
    const tags = Array.from(document.querySelectorAll(".post-meta__tag-list .post-meta__tags")).map(item => item.textContent?.trim()).filter(Boolean);
    const wordCountNode = document.querySelector(".word-count");
    const wordCount = wordCountNode?.textContent?.trim() || "";

    if (wordCount === "0") {
      document.querySelector(".post-meta-wordcount")?.classList.add("is-empty");
    }

    const insight = createElement(
      "section",
      "post-insight-card",
      `
        <div class="post-insight-card__main">
          <span class="eyebrow">ARTICLE OVERVIEW</span>
          <h2>先快速扫一眼，再决定怎么读</h2>
          <p>这篇文章适合先看目录和标签，再选择顺序阅读全文或按章节跳读。</p>
        </div>
        <div class="post-insight-card__meta">
          <div class="chip-row">
            ${readTime ? `<span class="chip">阅读时长 ${readTime}</span>` : ""}
            ${wordCount && wordCount !== "0" ? `<span class="chip">总字数 ${wordCount}</span>` : ""}
            <span class="chip">章节标题 ${headings}</span>
            ${categories.slice(0, 2).map(item => `<span class="chip">${item}</span>`).join("")}
            ${tags.slice(0, 2).map(item => `<span class="chip chip-ghost"># ${item}</span>`).join("")}
          </div>
          <button class="copy-link-btn" type="button">复制文章链接</button>
        </div>
      `
    );

    article.parentNode.insertBefore(insight, article);

    const copyButton = insight.querySelector(".copy-link-btn");
    copyButton?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copyButton.textContent = "链接已复制";
        window.setTimeout(() => {
          copyButton.textContent = "复制文章链接";
        }, 1600);
      } catch {
        copyButton.textContent = "复制失败";
        window.setTimeout(() => {
          copyButton.textContent = "复制文章链接";
        }, 1600);
      }
    });
  };

  const initReadingProgress = () => {
    let bar = document.querySelector(".reading-progress");
    if (!bar) {
      bar = createElement("div", "reading-progress");
      document.body.appendChild(bar);
    }

    const article = document.querySelector("#article-container");
    if (!article) {
      bar.style.width = "0%";
      return;
    }

    const update = () => {
      const rect = article.getBoundingClientRect();
      const start = window.scrollY + rect.top - 120;
      const end = start + article.offsetHeight - window.innerHeight * 0.6;
      const progress = ((window.scrollY - start) / Math.max(1, end - start)) * 100;
      const value = Math.max(0, Math.min(100, progress));
      bar.style.width = `${value}%`;
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
    normalizeRecentPostCards();
    normalizeRelatedCards();
    initHomeSpotlight();
    initHomeFilters();
    initPageSummary();
    initPostInsights();
    initReadingProgress();
    initExternalLinks();
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
