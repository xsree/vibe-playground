/* SVG Visual Lab 应用逻辑：选项卡 / 卡片渲染 / 语法高亮 / 实时代码执行 / 主题切换 */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var tabsEl = document.getElementById("tabs");
  var activeSection = "basic";

  /* ---------- 主题 ---------- */

  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("svl-theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  document.getElementById("themeToggle").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("svl-theme", next); } catch (e) {}
  });

  /* ---------- 语法高亮 ---------- */

  function escapeHtml(src) {
    return src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightSvg(src) {
    return escapeHtml(src).replace(
      /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[\w-]+|\/?&gt;)|([\w-]+)(=)("[^"]*")/g,
      function (m, com, tag, attr, eq, str) {
        if (com) return '<span class="tk-com">' + com + "</span>";
        if (tag) {
          return '<span class="tk-pun">' +
            tag.replace(/(&lt;\/?)([\w-]+)/, '$1<span class="tk-tag">$2</span>') +
            "</span>";
        }
        return '<span class="tk-attr">' + attr + '</span>' +
               '<span class="tk-pun">=</span>' +
               '<span class="tk-str">' + str + "</span>";
      }
    );
  }

  function highlightJs(src) {
    return escapeHtml(src).replace(
      /(\/\/[^\n]*)|('[^']*'|"[^"]*")|\b(const|let|var|function|return|new|true|false|null)\b|\b(\d+(?:\.\d+)?)\b/g,
      function (m, com, str, kw, num) {
        if (com) return '<span class="tk-com">' + com + "</span>";
        if (str) return '<span class="tk-str">' + str + "</span>";
        if (kw) return '<span class="tk-kw">' + kw + "</span>";
        return '<span class="tk-num">' + num + "</span>";
      }
    );
  }

  function highlight(code, lang) {
    return lang === "js" ? highlightJs(code) : highlightSvg(code);
  }

  /* ---------- 选项卡 ---------- */

  var tabs = [{ id: "all", title: "全部", count: 0 }].concat(
    SECTIONS.map(function (s) {
      return { id: s.id, title: s.title, count: s.items.length };
    })
  );
  tabs[0].count = SECTIONS.reduce(function (n, s) { return n + s.items.length; }, 0);

  tabs.forEach(function (t) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn" + (t.id === activeSection ? " active" : "");
    btn.innerHTML = t.title + '<span class="tab-count">' + t.count + "</span>";
    btn.addEventListener("click", function () {
      activeSection = t.id;
      tabsEl.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      render();
    });
    tabsEl.appendChild(btn);
  });

  /* ---------- 卡片 ---------- */

  function buildCard(item) {
    var card = document.createElement("article");
    card.className = "card";

    var head = document.createElement("div");
    head.className = "card-head";
    var h3 = document.createElement("h3");
    h3.textContent = item.title;
    var badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = item.tag;
    var q = document.createElement("p");
    q.className = "q";
    q.textContent = item.q;
    head.appendChild(h3);
    head.appendChild(badge);
    head.appendChild(q);

    var body = document.createElement("div");
    body.className = "card-body";

    // 左：代码
    var codePane = document.createElement("div");
    codePane.className = "code-pane";
    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "复制";
    copyBtn.addEventListener("click", function () {
      var done = function () {
        copyBtn.textContent = "已复制";
        copyBtn.classList.add("copied");
        setTimeout(function () {
          copyBtn.textContent = "复制";
          copyBtn.classList.remove("copied");
        }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(item.code).then(done, done);
      } else { done(); }
    });
    var pre = document.createElement("pre");
    var codeEl = document.createElement("code");
    codeEl.innerHTML = highlight(item.code, item.lang);
    pre.appendChild(codeEl);
    codePane.appendChild(copyBtn);
    codePane.appendChild(pre);

    // 右：可视化
    var viz = document.createElement("div");
    viz.className = "viz-pane";
    if (item.lang === "svg") {
      viz.innerHTML = item.code;
    } else {
      try {
        new Function("mount", item.code)(viz);
      } catch (err) {
        viz.textContent = "执行出错：" + err.message;
      }
    }
    if (item.note) {
      var note = document.createElement("div");
      note.className = "viz-note";
      note.textContent = item.note;
      viz.appendChild(note);
    }

    body.appendChild(codePane);
    body.appendChild(viz);
    card.appendChild(head);
    card.appendChild(body);
    return card;
  }

  /* ---------- 渲染 ---------- */

  function render() {
    app.innerHTML = "";
    SECTIONS.forEach(function (sec) {
      if (activeSection !== "all" && sec.id !== activeSection) return;

      var head = document.createElement("div");
      head.className = "section-head";
      var h2 = document.createElement("h2");
      h2.textContent = sec.title;
      var p = document.createElement("p");
      p.textContent = sec.desc + " · " + sec.items.length + " 个示例";
      head.appendChild(h2);
      head.appendChild(p);
      app.appendChild(head);

      sec.items.forEach(function (item) {
        app.appendChild(buildCard(item));
      });
    });
  }

  render();
})();
