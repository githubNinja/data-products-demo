/* ==========================================================
   Page logic. Draws the page from window.SITE (content.js).
   No libraries. All text is inserted with textContent, never
   innerHTML, so content can't inject code into the page.
   ========================================================== */
(function () {
  "use strict";

  var SITE = window.SITE;
  if (!SITE) { return; }
  var SVG_NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = String(text); }
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, obj);
  }
  function status(s) { return s === "ok" || s === "warn" || s === "bad" ? s : ""; }
  function chip(text, st) {
    var c = el("span", "chip");
    if (st) { c.appendChild(el("span", "dot " + status(st))); }
    c.appendChild(el("span", null, text));
    return c;
  }
  function row(left, right) {
    var r = el("div", "row");
    r.appendChild(typeof left === "string" ? el("span", null, left) : left);
    if (right) { r.appendChild(typeof right === "string" ? el("span", "mono", right) : right); }
    return r;
  }

  /* ---------- simple text bindings ---------- */
  document.querySelectorAll("[data-bind]").forEach(function (n) {
    var v = get(SITE, n.getAttribute("data-bind"));
    if (v !== undefined) { n.textContent = v; }
  });
  if (SITE.notice) {
    var notice = document.getElementById("notice");
    notice.textContent = SITE.notice;
    notice.hidden = false;
  }

  /* ---------- hero flow + values ---------- */
  var flow = document.getElementById("flow");
  (SITE.flow || []).forEach(function (s) {
    var d = el("div", "stage");
    d.appendChild(el("b", null, s.name));
    d.appendChild(el("span", null, s.note));
    flow.appendChild(d);
  });
  var values = document.getElementById("values");
  (SITE.values || []).forEach(function (v) {
    var d = el("div");
    d.appendChild(el("h3", null, v.title));
    d.appendChild(el("p", null, v.text));
    values.appendChild(d);
  });

  /* ---------- snippet renderers ---------- */
  function sparkline(values) {
    var w = 200, h = 50, pad = 4;
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var range = max - min || 1;
    var pts = values.map(function (v, i) {
      var x = (i / (values.length - 1)) * (w - pad * 2) + pad;
      var y = h - pad - ((v - min) / range) * (h - pad * 2);
      return [x.toFixed(1), y.toFixed(1)];
    });
    var s = svg("svg", { viewBox: "0 0 " + w + " " + h, "aria-hidden": "true", width: "100%" });
    s.appendChild(svg("polyline", { "class": "spark", points: pts.map(function (p) { return p.join(","); }).join(" ") }));
    var last = pts[pts.length - 1];
    s.appendChild(svg("circle", { "class": "spark-end", cx: last[0], cy: last[1], r: 3 }));
    return s;
  }

  function codeBlock(text) {
    var pre = el("pre", "code");
    String(text).split("\n").forEach(function (line, i) {
      if (i > 0) { pre.appendChild(document.createTextNode("\n")); }
      var first = line.charAt(0);
      if (first === "+" || first === "−" || first === "-") {
        pre.appendChild(el("span", first === "+" ? "add" : "del", line));
        return;
      }
      var m = line.match(/^(\s*"?[A-Za-z_][\w ]*"?)(:)(.*)$/);
      if (m) {
        pre.appendChild(el("span", "k", m[1]));
        pre.appendChild(document.createTextNode(m[2] + m[3]));
      } else {
        pre.appendChild(document.createTextNode(line));
      }
    });
    return pre;
  }

  function miniLineage(sn) {
    var sources = sn.sources || [], outputs = sn.outputs || [];
    var rowH = 34, n = Math.max(sources.length, outputs.length, 1);
    var H = n * rowH + 8, W = 260, mid = H / 2;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, "class": "mini-lineage", role: "img",
      "aria-label": "Lineage: " + sources.join(", ") + " feed " + sn.model + (outputs.length ? ", which feeds " + outputs.join(", ") : "") });
    function box(x, y, w, label, focus) {
      s.appendChild(svg("rect", { x: x, y: y - 11, width: w, height: 22, rx: 5, "class": focus ? "focus" : "" }));
      var t = svg("text", { x: x + 6, y: y + 3 });
      t.textContent = label;
      s.appendChild(t);
    }
    function ys(count) {
      var top = mid - ((count - 1) * rowH) / 2;
      return Array.apply(null, Array(count)).map(function (_, i) { return top + i * rowH; });
    }
    var srcY = ys(sources.length), outY = ys(outputs.length);
    srcY.forEach(function (y) { s.appendChild(svg("path", { d: "M74 " + y + " C100 " + y + " 100 " + mid + " 126 " + mid })); });
    outY.forEach(function (y) { s.appendChild(svg("path", { d: "M196 " + mid + " C206 " + mid + " 206 " + y + " 214 " + y })); });
    sources.forEach(function (label, i) { box(2, srcY[i], 72, label); });
    box(126, mid, 70, sn.model, true);
    outputs.forEach(function (label, i) { box(214, outY[i], 44, label); });
    return s;
  }

  function snippet(sn) {
    var box = el("div", "snip");
    sn = sn || {};
    if (sn.title || sn.badge) {
      box.appendChild(row(el("span", "mono", sn.title || ""), sn.badge ? chip(sn.badge.text, sn.badge.status) : null));
    }
    switch (sn.type) {
      case "stats":
        (sn.rows || []).forEach(function (r) {
          var label = el("span", "muted", r[0]);
          box.appendChild(row(label, r[1]));
        });
        if (sn.spark && sn.spark.length > 1) { box.appendChild(sparkline(sn.spark)); }
        break;
      case "code":
        box.appendChild(codeBlock(sn.code || ""));
        break;
      case "rows":
        if (sn.search) { box.appendChild(el("div", "search", sn.search)); }
        (sn.items || []).forEach(function (it) {
          var left = el("span");
          left.appendChild(el("span", it.sub ? null : "mono", it.label));
          if (it.sub) { left.appendChild(el("span", "muted", " · " + it.sub)); }
          box.appendChild(row(left, it.chip ? chip(it.chip, it.status) : null));
        });
        break;
      case "bars":
        (sn.items || []).forEach(function (it) {
          var wrap = el("div");
          wrap.appendChild(row(it.label, it.value));
          var bar = el("div", "bar"), fill = el("i");
          fill.style.width = Math.max(0, Math.min(100, Number(it.pct) || 0)) + "%";
          bar.appendChild(fill);
          wrap.appendChild(bar);
          box.appendChild(wrap);
        });
        break;
      case "tiles":
        var t = el("div", "tiles");
        (sn.items || []).forEach(function (x) { t.appendChild(el("span", null, x)); });
        box.appendChild(t);
        break;
      case "lineage":
        box.appendChild(miniLineage(sn));
        break;
    }
    if (sn.note) { box.appendChild(el("div", "note", sn.note)); }
    return box;
  }

  /* ---------- platform tabs ---------- */
  var tabsEl = document.getElementById("tabs");
  var panelsEl = document.getElementById("panels");
  var progressBar = document.querySelector("#progress i");
  var pillars = (SITE.platform && SITE.platform.pillars) || [];
  var tabs = [], panels = [], active = 0, auto = !reduceMotion, timer = null;

  pillars.forEach(function (p, i) {
    var tab = el("button", "tab", p.name);
    tab.type = "button";
    tab.id = "tab-" + i;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "panel-" + i);
    tab.addEventListener("click", function () { stopAuto(); show(i); });
    tab.addEventListener("keydown", function (e) {
      var k = e.key, next = null;
      if (k === "ArrowRight") { next = (i + 1) % pillars.length; }
      if (k === "ArrowLeft") { next = (i - 1 + pillars.length) % pillars.length; }
      if (k === "Home") { next = 0; }
      if (k === "End") { next = pillars.length - 1; }
      if (next !== null) { e.preventDefault(); stopAuto(); show(next); tabs[next].focus(); }
    });
    tabsEl.appendChild(tab);
    tabs.push(tab);

    var panel = el("div", "tabpanel");
    panel.id = "panel-" + i;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.appendChild(el("h3", null, p.title));
    var cards = el("div", "cards");
    (p.caps || []).forEach(function (c) {
      var card = el("article", "panel cap");
      card.appendChild(snippet(c.snip));
      var txt = el("div");
      txt.appendChild(el("h4", null, c.title));
      txt.appendChild(el("p", null, c.text));
      card.appendChild(txt);
      cards.appendChild(card);
    });
    panel.appendChild(cards);
    panelsEl.appendChild(panel);
    panels.push(panel);
  });

  function restartProgress() {
    if (!progressBar) { return; }
    progressBar.classList.remove("run");
    void progressBar.offsetWidth; // restart the CSS animation
    if (auto) { progressBar.classList.add("run"); }
  }
  function show(i) {
    active = i;
    tabs.forEach(function (t, j) {
      t.setAttribute("aria-selected", j === i ? "true" : "false");
      t.tabIndex = j === i ? 0 : -1;
    });
    panels.forEach(function (p, j) { p.hidden = j !== i; });
    restartProgress();
  }
  function stopAuto() {
    auto = false;
    if (timer) { clearInterval(timer); }
    document.getElementById("progress").hidden = true;
  }
  if (pillars.length) {
    show(0);
    if (auto) {
      timer = setInterval(function () { show((active + 1) % pillars.length); }, 7000);
    } else {
      document.getElementById("progress").hidden = true;
    }
  }

  /* ---------- architecture ---------- */
  var arch = SITE.architecture || { columns: [] };
  var nodes = {}, buttons = {}, parents = {};
  arch.columns.forEach(function (c) {
    c.nodes.forEach(function (n) { nodes[n.id] = { node: n, col: c.name }; parents[n.id] = parents[n.id] || []; });
  });
  Object.keys(nodes).forEach(function (id) {
    (nodes[id].node.to || []).forEach(function (t) { (parents[t] = parents[t] || []).push(id); });
  });

  function walk(start, nextFn) {
    var seen = {}, stack = [start];
    while (stack.length) {
      var cur = stack.pop();
      if (seen[cur]) { continue; }
      seen[cur] = true;
      (nextFn(cur) || []).forEach(function (x) { stack.push(x); });
    }
    return seen;
  }

  var archEl = document.getElementById("arch");
  arch.columns.forEach(function (c) {
    var col = el("div", "col");
    col.appendChild(el("h4", null, c.name));
    var stack = el("div", "stack");
    c.nodes.forEach(function (n) {
      var b = el("button", "node");
      b.type = "button";
      b.appendChild(el("span", null, n.name));
      b.appendChild(el("small", null, n.tech));
      b.addEventListener("click", function () { select(n.id); });
      buttons[n.id] = b;
      stack.appendChild(b);
    });
    col.appendChild(stack);
    archEl.appendChild(col);
  });

  function select(id) {
    if (!nodes[id]) { return; }
    var down = walk(id, function (x) { return nodes[x] ? nodes[x].node.to : []; });
    var up = walk(id, function (x) { return parents[x]; });
    Object.keys(buttons).forEach(function (k) {
      var b = buttons[k], related = down[k] || up[k];
      b.classList.toggle("on", k === id);
      b.classList.toggle("hot", k !== id && !!related);
      b.classList.toggle("dim", !related);
      b.setAttribute("aria-pressed", k === id ? "true" : "false");
    });
    var info = nodes[id];
    document.getElementById("d-col").textContent = info.col;
    document.getElementById("d-name").textContent = info.node.name;
    document.getElementById("d-tech").textContent = info.node.tech;
    document.getElementById("d-text").textContent = info.node.detail || "";
    var feeds = (info.node.to || []).map(function (t) { return nodes[t] ? nodes[t].node.name : t; });
    document.getElementById("d-feeds").textContent = feeds.length ? "Feeds " + feeds.join(", ") : "";
  }
  var first = arch.selected && nodes[arch.selected] ? arch.selected : Object.keys(nodes)[0];
  if (first) { select(first); }

  /* ---------- products table ---------- */
  var tbody = document.getElementById("product-rows");
  var prod = SITE.products || { rows: [] };
  var labels = prod.statusText || { ok: "Healthy", warn: "At risk", bad: "Incident" };
  prod.rows.forEach(function (p) {
    var tr = el("tr");
    tr.appendChild(el("td", "name", p.name));
    tr.appendChild(el("td", "muted", p.owner));
    tr.appendChild(el("td", "mono", p.fresh));
    tr.appendChild(el("td", "num", typeof p.uptime === "number" ? p.uptime.toFixed(2) + "%" : p.uptime));
    tr.appendChild(el("td", "num", typeof p.users === "number" ? p.users.toLocaleString() : p.users));
    var td = el("td");
    td.appendChild(chip(labels[p.status] || p.status, p.status));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
})();
