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
