const revealItems = document.querySelectorAll(
  "section, header, footer, .feature-item, .example-card, .demo-card"
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => observer.observe(item));

const installBtn = document.getElementById("installBtn");

installBtn.addEventListener("click", () => {
  window.open(
    "https://marketplace.visualstudio.com/items?itemName=CIRSS.argblazer",
    "_blank"
  );
});

window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "argblazer-theme") {
    document.querySelectorAll("iframe").forEach((iframe) => {
      if (iframe.contentWindow !== event.source) {
        iframe.contentWindow.postMessage(event.data, "*");
      }
    });
  }
});

/* Set green theme for report iframes */
sessionStorage.setItem("argblazer_global_sessionTheme", "green");

/* Initialize mermaid for demo graphs */
mermaid.initialize({ startOnLoad: true, flowchart: { padding: 0.01, htmlLabels: true } });
