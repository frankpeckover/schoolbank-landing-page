(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealItems = document.querySelectorAll(
    ".community-grid article, .feature-row, .section-copy, .illustration-shot, .faq-grid article, .walkthrough-form"
  );
  var ledgers = document.querySelectorAll(".visual-ledger[data-progress]");

  function formatBalance(value, suffix) {
    return Math.round(value).toLocaleString() + suffix;
  }

  function animateLedger(ledger) {
    if (ledger.dataset.animated === "true") {
      return;
    }

    ledger.dataset.animated = "true";

    var balance = ledger.querySelector("[data-count-target]");
    var target = balance ? Number(balance.dataset.countTarget || 0) : 0;
    var suffix = balance ? balance.dataset.countSuffix || "" : "";
    var progressValue = Number(ledger.dataset.progress || 0);

    ledger.style.setProperty("--progress-value", Math.max(0, Math.min(progressValue, 100)) + "%");

    if (reduceMotion) {
      if (balance) {
        balance.textContent = formatBalance(target, suffix);
      }
      ledger.classList.add("is-animated");
      return;
    }

    ledger.classList.add("is-animated");

    if (!balance) {
      return;
    }

    var duration = 1900;
    var startTime = null;

    function tick(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      var elapsed = timestamp - startTime;
      var progressRatio = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progressRatio, 3);

      balance.textContent = formatBalance(target * eased, suffix);

      if (progressRatio < 1) {
        window.requestAnimationFrame(tick);
      } else {
        balance.textContent = formatBalance(target, suffix);
      }
    }

    window.requestAnimationFrame(tick);
  }

  revealItems.forEach(function (item, index) {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", Math.min(index % 6, 5) * 80 + "ms");
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
    ledgers.forEach(animateLedger);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll(".visual-ledger[data-progress]").forEach(animateLedger);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px 18% 0px",
      threshold: 0.01
    }
  );

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
})();
