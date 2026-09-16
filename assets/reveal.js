(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealItems = document.querySelectorAll(
    ".community-grid article, .feature-row, .section-copy, .illustration-shot, .faq-grid article, .security-section > div, .security-grid span, .walkthrough-form"
  );

  revealItems.forEach(function (item, index) {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-delay", Math.min(index % 6, 5) * 80 + "ms");
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
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
