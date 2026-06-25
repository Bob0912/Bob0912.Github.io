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
    if (window.GLOBAL_CONFIG_SITE?.pageType !== "home") return;

    const contentInner = document.querySelector("#content-inner");
    const recentPosts = document.querySelector("#recent-posts");
    if (!contentInner || !recentPosts) return;

    contentInner.querySelector(".home-spotlight")?.remove();

    const articleCount = text(".card-info .site-data a:nth-child(1) .length-num");
    const tagCount = text(".card-info .site-data a:nth-child(2) .length-num");
    const categoryCount = text(".card-info .site-data a:nth-child(3) .length-num");
    const wordCount = Array.from(document.querySelectorAll(".card-webinfo .webinfo-item")).find(item =>
      item.querySelector(".item-name")?.textContent?.includes("总字数")
    )?.querySelector(".item-count")?.textContent?.trim();

    const categoryLinks = Array.from(document.querySelectorAll("#aside-cat-list > .card-category-list-item > .card-category-list-link"))
      .slice(0, 4)
      .map(link => ({
        href: link.getAttribute("href") || "#",
        name: text(".card-category-list-name", link),
        count: text(".card-category-list-count", link)
      }));

    const latestTitles = Array.from(document.querySelectorAll(".recent-post-item .article-title"))
      .slice(0, 3)
      .map(link => ({
        href: link.getAttribute("href") || "#",
        title: link.textContent?.trim() || ""
      }))
      .filter(item => item.title);

    const spotlight = createElement(
      "section",
      "home-spotlight",
      `
        <div class="home-spotlight__copy">
          <span class="home-spotlight__eyebrow">TECH • READING • LIFE</span>
          <h2>把分散的经验，整理成能反复回看的文章。</h2>
          <p>这里更像一份长期更新的个人知识档案：有技术笔记，也有生活观察，尽量把复杂内容讲清楚，把零散感受写明白。</p>
          <div class="home-spotlight__actions">
            <a href="/archives/">查看归档</a>
            <a href="/categories/">按分类浏览</a>
            <a href="https://github.com/Bob0912" target="_blank" rel="noopener">访问 GitHub</a>
          </div>
        </div>
        <div class="home-spotlight__meta">
          <div class="home-stat-grid">
            <div class="home-stat-card"><span class="label">文章</span><strong>${articleCount || "-"}</strong></div>
            <div class="home-stat-card"><span class="label">标签</span><strong>${tagCount || "-"}</strong></div>
            <div class="home-stat-card"><span class="label">分类</span><strong>${categoryCount || "-"}</strong></div>
            <div class="home-stat-card"><span class="label">总字数</span><strong>${wordCount || "-"}</strong></div>
          </div>
          <div class="home-spotlight__topics">
            <div class="section-title">重点主题</div>
            <div class="topic-list">
              ${categoryLinks
                .map(
                  item => `<a class="topic-chip" href="${item.href}"><span>${item.name}</span><em>${item.count}</em></a>`
                )
                .join("")}
            </div>
          </div>
          <div class="home-spotlight__recent">
            <div class="section-title">最近更新</div>
            <ul>
              ${latestTitles.map(item => `<li><a href="${item.href}">${item.title}</a></li>`).join("")}
            </ul>
          </div>
        </div>
      `
    );

    contentInner.insertBefore(spotlight, recentPosts);
  };

  const initHomeFilters = () => {
    if (window.GLOBAL_CONFIG_SITE?.pageType !== "home") return;

    const recentPosts = document.querySelector("#recent-posts");
    const items = Array.from(document.querySelectorAll(".recent-post-item"));
    if (!recentPosts || !items.length) return;

    recentPosts.querySelector(".home-filter-panel")?.remove();

    const categoryCount = new Map();
    items.forEach(item => {
      const category = item.dataset.category || "未分类";
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    const filters = [
      { key: "all", label: "全部", count: items.length },
      ...Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => ({ key, label: key, count }))
    ];

    const panel = createElement(
      "section",
      "home-filter-panel",
      `
        <div class="home-filter-panel__intro">
          <span class="eyebrow">SMART BROWSE</span>
          <h3>按主题快速筛选这页文章</h3>
          <p>如果你不是想按时间倒着看，可以直接按主题切换。</p>
        </div>
        <div class="home-filter-panel__chips">
          ${filters
            .map(
              (filter, index) =>
                `<button class="home-filter-chip${index === 0 ? " is-active" : ""}" type="button" data-filter="${filter.key}"><span>${filter.label}</span><em>${filter.count}</em></button>`
            )
            .join("")}
        </div>
      `
    );

    recentPosts.insertBefore(panel, recentPosts.firstChild);

    panel.querySelectorAll(".home-filter-chip").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.filter || "all";
        panel.querySelectorAll(".home-filter-chip").forEach(node => node.classList.remove("is-active"));
        button.classList.add("is-active");

        items.forEach(item => {
          const match = key === "all" || item.dataset.category === key;
          item.classList.toggle("is-hidden", !match);
        });
      });
    });
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
