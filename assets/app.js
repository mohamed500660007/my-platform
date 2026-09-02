/* ══════════════════════════════════════════════════════════════
   منصّة بــن نــاجــح — سلوك الواجهة
   الكشف عند التمرير · النافبار · القارئ · ويدجت الوحدات ·
   رحلة «إزاي بتشتغل» · التابلت التفاعلي
   ══════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarse = window.matchMedia("(pointer: coarse)");

  /* ── ١ · الكشف عند الظهور ── */
  var targets = document.querySelectorAll("[data-anim], .rv-host, .hl.mark, .draw, .track i");

  if (!("IntersectionObserver" in window) || reduce.matches){
    for (var i=0;i<targets.length;i++) targets[i].classList.add("rv");
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target, d = el.getAttribute("data-d");
        if (d !== null && !el.style.getPropertyValue("--d")){
          el.style.setProperty("--d", (parseFloat(d) * 0.11 + 0.1).toFixed(2) + "s");
        }
        el.classList.add("rv");
        io.unobserve(el);
      });
    }, { rootMargin:"0px 0px -10% 0px", threshold:0.14 });
    for (var j=0;j<targets.length;j++) io.observe(targets[j]);

    /* الهيرو استثناء: الاسم لازم يترسم من أول ثانية مهما كان مكانه */
    requestAnimationFrame(function(){
      [].forEach.call(document.querySelectorAll("#hero .rv-host, #hero [data-anim]"), function(el){
        el.classList.add("rv"); io.unobserve(el);
      });
    });
  }

  /* ── ٢ · حلقة تمرير واحدة ── */
  var fill = document.querySelector(".nprog i");
  var nav  = document.getElementById("nav");
  var dock = document.getElementById("dock");
  var hero = document.getElementById("hero");
  var parEls = [].slice.call(document.querySelectorAll(".par"));
  var jour   = document.getElementById("jour");
  var jnum   = document.getElementById("jnum");
  var jpips  = jour ? [].slice.call(jour.querySelectorAll("#jpips i")) : [];
  var jsteps = jour ? [].slice.call(jour.querySelectorAll(".jstep")) : [];
  var AR = ["٠","١","٢","٣","٤"];
  var ticking = false;

  function onFrame(){
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var vh = window.innerHeight;
    var doc = document.documentElement.scrollHeight - vh;

    if (fill) fill.style.width = (doc > 0 ? Math.min(100, (y/doc)*100) : 0) + "%";
    if (nav)  nav.classList.toggle("stuck", y > 18);
    if (dock && hero) dock.classList.toggle("up", y > hero.offsetHeight * 0.6);

    /* الرحلة: نسبة التقدّم من مكان القسم في الشاشة */
    if (jour){
      var jr = jour.getBoundingClientRect();
      var span = jr.height + vh * 0.55;
      var p = (vh * 0.82 - jr.top) / span;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      jour.style.setProperty("--jp", p.toFixed(4));
      var done = 0;
      for (var k=0;k<jsteps.length;k++){
        var on = p >= (0.10 + k * 0.215);
        jsteps[k].classList.toggle("hit", on);
        if (jpips[k]) jpips[k].classList.toggle("on", on);
        if (on) done++;
      }
      if (jnum && jnum.textContent !== AR[done]) jnum.textContent = AR[done];
    }

    if (!reduce.matches){
      for (var i=0;i<parEls.length;i++){
        var el = parEls[i], r = el.getBoundingClientRect();
        if (r.bottom < -180 || r.top > vh + 180) continue;
        var depth = parseFloat(getComputedStyle(el).getPropertyValue("--md")) || 0;
        var off = ((r.top + r.height/2) - vh/2) / vh;
        el.style.setProperty("--py", (off * depth * -24).toFixed(2) + "px");
      }
    }
  }
  function req(){ if (!ticking){ ticking = true; requestAnimationFrame(onFrame); } }
  window.addEventListener("scroll", req, { passive:true });
  window.addEventListener("resize", req, { passive:true });
  req();

  /* ── ٥ · أزرار مغناطيسية ── */
  if (!coarse.matches && !reduce.matches){
    [].forEach.call(document.querySelectorAll(".magnetic"), function(b){
      b.addEventListener("pointermove", function(ev){
        var r = b.getBoundingClientRect();
        b.style.setProperty("--gx", (((ev.clientX - r.left)/r.width  - .5) * 12).toFixed(1) + "px");
        b.style.setProperty("--gy", (((ev.clientY - r.top )/r.height - .5) * 8 ).toFixed(1) + "px");
      }, { passive:true });
      b.addEventListener("pointerleave", function(){
        b.style.setProperty("--gx","0px"); b.style.setProperty("--gy","0px");
      }, { passive:true });
    });
  }

  /* ── ٦ · تمييز القسم الحالي ── */
  var spy = [].slice.call(document.querySelectorAll("[data-spy]"));
  var secs = ["how","courses","reviews","app"]
    .map(function(id){ return document.getElementById(id); }).filter(Boolean);
  if (secs.length && "IntersectionObserver" in window){
    var sio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        spy.forEach(function(a){ a.classList.toggle("on", a.getAttribute("data-spy") === e.target.id); });
      });
    }, { rootMargin:"-45% 0px -45% 0px", threshold:0 });
    secs.forEach(function(s){ sio.observe(s); });
  }

  /* ── ٦ · ويدجت معاينة الوحدات ── */
  var widgets = [].slice.call(document.querySelectorAll("[data-widget]"));

  /* الـiframe مقاسه ثابت ٩٠٠px وبيتصغّر بـtransform — نحسب المعامل من عرض المنفذ */
  function fitPort(w){
    var port = w.querySelector(".wport");
    if (!port || !port.clientWidth) return;
    w.style.setProperty("--sc", (port.clientWidth / 900).toFixed(4));
  }

  /* تحميل كسول: الـiframe ما بيتحمّلش غير لما التبويب بتاعه يشتغل */
  function loadView(w, view){
    var pane = w.querySelector('.wview[data-view="' + view + '"]');
    if (!pane) return;
    var fr = pane.querySelector("iframe[data-src]");
    if (fr && !fr.getAttribute("src")){
      fr.addEventListener("load", function(){ fr.classList.add("ready"); }, { once:true });
      fr.setAttribute("src", fr.getAttribute("data-src"));
    }
    var href = pane.getAttribute("data-href");
    if (href){
      var url = w.querySelector(".wurl"), open = w.querySelector(".wopen");
      if (url) url.textContent = href;
      if (open) open.setAttribute("href", href);
    }
  }

  widgets.forEach(function(w){
    var tabs  = [].slice.call(w.querySelectorAll(".wtab"));
    var views = [].slice.call(w.querySelectorAll(".wview"));
    var dots  = [].slice.call(w.querySelectorAll(".wpages i"));

    function activate(view, moveFocus){
      tabs.forEach(function(t){
        var on = t.getAttribute("data-view") === view;
        t.classList.toggle("on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (on && moveFocus) t.focus();
      });
      views.forEach(function(p){ p.classList.toggle("on", p.getAttribute("data-view") === view); });
      w.classList.remove("playing");
      loadView(w, view);
      fitPort(w);
    }

    tabs.forEach(function(t, i){
      t.addEventListener("click", function(){ activate(t.getAttribute("data-view")); });
      t.addEventListener("keydown", function(ev){
        if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
        ev.preventDefault();
        /* RTL: السهم الشمال = التبويب اللي بعده */
        var dir = (ev.key === "ArrowLeft") ? 1 : -1;
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        activate(next.getAttribute("data-view"), true);
      });
    });

    /* تقليب نقط الصفحات مع تمرير المعاينة */
    if (dots.length > 1){
      var step = 0, timer = 0;
      w.addEventListener("pointerenter", function(){
        if (reduce.matches) return;
        timer = setInterval(function(){
          step = (step + 1) % dots.length;
          dots.forEach(function(d, k){ d.classList.toggle("on", k === step); });
        }, 620);
      });
      w.addEventListener("pointerleave", function(){
        clearInterval(timer); timer = 0; step = 0;
        dots.forEach(function(d, k){ d.classList.toggle("on", k === 0); });
      });
    }

    /* كشف الإجابة النموذجية */
    var quiz = w.querySelector(".quiz");
    if (quiz){
      var qb = quiz.querySelector(".qbtn");
      var label = quiz.querySelector(".qlabel");
      if (qb) qb.addEventListener("click", function(){
        var open = quiz.classList.toggle("open");
        qb.setAttribute("aria-expanded", open ? "true" : "false");
        if (label) label.textContent = open ? "إخفاء الإجابة" : "اكشف الإجابة النموذجية";
      });
    }

    /* زرّ التشغيل — يفكّ المعاينة ويخليها تفاعلية */
    var play = w.querySelector(".wplay button");
    if (play) play.addEventListener("click", function(){
      loadView(w, "slides");
      w.classList.add("playing");
    });

    fitPort(w);
  });

  window.addEventListener("resize", function(){ widgets.forEach(fitPort); }, { passive:true });
  window.addEventListener("load", function(){ widgets.forEach(fitPort); });

  /* حمّل معاينة التبويب النشط أول ما الكارت يقرّب من الشاشة */
  if (widgets.length && "IntersectionObserver" in window){
    var wio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var w = e.target;
        fitPort(w);
        var on = w.querySelector(".wtab.on");
        loadView(w, on ? on.getAttribute("data-view") : "doc");
        wio.unobserve(w);
      });
    }, { rootMargin:"250px 0px" });
    widgets.forEach(function(w){ if (!w.classList.contains("sealed")) wio.observe(w); });
  }


  /* ── ٧ · المؤشّر المنزلق في النافبار ── */
  (function(){
    var links = [].slice.call(document.querySelectorAll(".nlinks a"));
    var ink   = document.querySelector(".nink");
    if (!ink || !links.length) return;

    function place(el, show){
      if (!el){ ink.style.opacity = "0"; return; }
      var host = ink.parentElement.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      /* في RTL نقيس من الحافة اليمنى للحاوية */
      var offset = host.right - r.right;
      ink.style.width = r.width + "px";
      ink.style.transform = "translate(" + (-offset) + "px, -50%)";
      ink.style.opacity = show ? "1" : "0";
    }
    function current(){ return document.querySelector(".nlinks a.on"); }
    function rest(){ var c = current(); place(c, !!c); }

    links.forEach(function(a){
      a.addEventListener("pointerenter", function(){ place(a, true); });
      a.addEventListener("focus", function(){ place(a, true); });
    });
    var box = ink.parentElement;
    box.addEventListener("pointerleave", rest);
    box.addEventListener("focusout", rest);
    window.addEventListener("resize", rest, { passive:true });
    /* الـspy بيغيّر .on فنعيد الضبط */
    new MutationObserver(rest).observe(box, { subtree:true, attributes:true, attributeFilter:["class"] });
    setTimeout(rest, 400);
  })();

  /* ── ٨ · القارئ: أي درس بيتفتح جوّه المنصّة ── */
  (function(){
    var reader = document.getElementById("reader");
    if (!reader) return;
    var shell   = reader.querySelector(".reader-shell");
    var frame   = document.getElementById("readerFrame");
    var titleEl = document.getElementById("readerTitle");
    var tabsEl  = document.getElementById("readerTabs");
    var loadEl  = document.getElementById("readerLoad");
    var newTab  = document.getElementById("readerNewTab");
    var lastFocus = null;

    /* كل محتوى المنصّة — عشان الطالب يلفّ بينه من غير ما يخرج */
    var LIB = [
      { src:"lesson-1-1.html",       label:"مذكّرة ١-١" },
      { src:"lesson-1-2.html",       label:"مذكّرة ١-٢" },
      { src:"lesson-1-3.html",       label:"مذكّرة ١-٣" },
      { src:"lesson-1-4.html",       label:"مذكّرة ١-٤" },
      { src:"presentation-1-1.html", label:"عرض ١-١" },
      { src:"questions-1-1.html",    label:"أسئلة ١-١" },
      { src:"questions-1-2.html",    label:"أسئلة ١-٢" },
      { src:"curriculum-map.html",   label:"خريطة المنهج" },
      { src:"Lesson-1-1.pdf",        label:"PDF الدرس ١-١" },
      { src:"Ben-Nagah-Bakalorya.pdf", label:"PDF المذكّرة" },
      { src:"Programming-ArtificialIntelligence-Ar-EB-part1.pdf", label:"PDF الكتاب المدرسي" }
    ];
    function labelOf(src){
      for (var i=0;i<LIB.length;i++) if (LIB[i].src === src) return LIB[i].label;
      return src;
    }

    function load(src){
      loadEl.classList.remove("gone");
      frame.classList.remove("ready");
      titleEl.textContent = labelOf(src);
      newTab.setAttribute("href", src);
      [].forEach.call(tabsEl.children, function(b){
        b.classList.toggle("on", b.getAttribute("data-src") === src);
        b.setAttribute("aria-selected", b.classList.contains("on") ? "true" : "false");
      });
      frame.addEventListener("load", function once(){
        frame.classList.add("ready");
        loadEl.classList.add("gone");
        frame.removeEventListener("load", once);
      });
      frame.setAttribute("src", src);
    }

    if (!tabsEl.children.length){
      LIB.forEach(function(item){
        var b = document.createElement("button");
        b.type = "button"; b.className = "rtab"; b.setAttribute("role","tab");
        b.setAttribute("data-src", item.src); b.textContent = item.label;
        b.addEventListener("click", function(){ load(item.src); });
        tabsEl.appendChild(b);
      });
    }

    function open(src){
      lastFocus = document.activeElement;
      reader.hidden = false;
      document.body.classList.add("reading");
      load(src);
      requestAnimationFrame(function(){ reader.classList.add("open"); });
      setTimeout(function(){ reader.querySelector(".reader-close").focus(); }, 120);
    }
    function close(){
      reader.classList.remove("open");
      document.body.classList.remove("reading");
      setTimeout(function(){
        reader.hidden = true;
        frame.removeAttribute("src");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }, 340);
    }

    [].forEach.call(reader.querySelectorAll("[data-rclose]"), function(el){
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function(ev){
      if (ev.key === "Escape" && !reader.hidden) close();
    });
    /* حبس التركيز جوّه القارئ */
    shell.addEventListener("keydown", function(ev){
      if (ev.key !== "Tab") return;
      var f = shell.querySelectorAll("button, a[href], iframe");
      if (!f.length) return;
      var first = f[0], last = f[f.length-1];
      if (ev.shiftKey && document.activeElement === first){ ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last){ ev.preventDefault(); first.focus(); }
    });

    /* أي رابط لصفحة محتوى محلّية بيفتح في القارئ بدل ما يسيب الصفحة */
    document.addEventListener("click", function(ev){
      var a = ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
      if (a.closest("#reader")) return;
      var href = a.getAttribute("href") || "";
      if (!/^[\w.-]+\.(html|pdf)$/i.test(href)) return;
      ev.preventDefault();
      open(href);
    });
  })();

  /* ── ٩ · التابلت: جهاز شغّال فعلًا ── */
  (function(){
    var tab = document.getElementById("tablet");
    if (!tab) return;
    var frame = document.getElementById("tabFrame");
    var load  = tab.querySelector(".tab-load");
    var glare = tab.querySelector(".tab-glare");
    var tabs  = [].slice.call(tab.querySelectorAll(".ttab"));
    var full  = document.getElementById("tabFull");
    var loaded = false;

    function show(src){
      load.classList.remove("gone");
      frame.classList.remove("ready");
      tabs.forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-src") === src); });
      frame.addEventListener("load", function once(){
        frame.classList.add("ready");
        load.classList.add("gone");
        frame.removeEventListener("load", once);
      });
      frame.setAttribute("src", src);
      loaded = true;
    }

    tabs.forEach(function(b){
      b.addEventListener("click", function(){ show(b.getAttribute("data-src")); });
    });

    if (full) full.addEventListener("click", function(){
      var on = tab.querySelector(".ttab.on");
      var src = on ? on.getAttribute("data-src") : "lesson-1-1.html";
      var link = document.createElement("a");
      link.setAttribute("href", src);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    /* حمّل أول ما التابلت يقرّب من الشاشة */
    if ("IntersectionObserver" in window){
      var io2 = new IntersectionObserver(function(en){
        en.forEach(function(e){
          if (e.isIntersecting && !loaded){ show("lesson-1-1.html"); io2.unobserve(tab); }
        });
      }, { rootMargin:"400px 0px" });
      io2.observe(tab);
    } else { show("lesson-1-1.html"); }

    /* ميلان ثلاثي الأبعاد — بيقف لما تحطّ إيدك على الشاشة عشان تقرا مرتاح */
    if (coarse.matches || reduce.matches) return;
    var stage = tab.parentElement, screen = tab.querySelector(".tab-screen");
    var raf = 0, tx = 0, ty = 0, live = false;

    stage.addEventListener("pointermove", function(ev){
      if (live) return;
      var r = tab.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width  - 0.5;
      var py = (ev.clientY - r.top)  / r.height - 0.5;
      tx = (-py * 9).toFixed(2); ty = (px * 12).toFixed(2);
      if (glare) glare.style.setProperty("--ga", (110 + px * 55).toFixed(0) + "deg");
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive:true });

    stage.addEventListener("pointerleave", reset, { passive:true });
    /* على الشاشة نفسها: نرجّع الجهاز مستوي ونسيبك تتعامل معاه */
    screen.addEventListener("pointerenter", function(){ live = true; tab.classList.add("live"); reset(); }, { passive:true });
    screen.addEventListener("pointerleave", function(){ live = false; tab.classList.remove("live"); }, { passive:true });

    function reset(){
      tx = 0; ty = 0;
      if (glare) glare.style.setProperty("--ga", "110deg");
      if (!raf) raf = requestAnimationFrame(apply);
    }
    function apply(){
      raf = 0;
      tab.style.setProperty("--tx", tx + "deg");
      tab.style.setProperty("--ty", ty + "deg");
    }
  })();

  /* ── ١٠ · بقعة الضوء على كروت الوحدات ── */
  if (!coarse.matches && !reduce.matches){
    [].forEach.call(document.querySelectorAll(".ucard"), function(card){
      card.addEventListener("pointermove", function(ev){
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((ev.clientX - r.left) / r.width  * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((ev.clientY - r.top)  / r.height * 100).toFixed(1) + "%");
      }, { passive:true });
    });
  }

  /* ── ١١ · روابط placeholder ── */
  document.addEventListener("click", function(ev){
    var a = ev.target.closest ? ev.target.closest('a[href="#"]') : null;
    if (a) ev.preventDefault();
  });

})();
