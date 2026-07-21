/**
 * Waqt embeddable widget loader (TRD §11). Target: <10kb minified.
 *
 * Usage on the host site:
 *   <div id="waqt-widget" data-business="salon-xyz"></div>
 *   <script src="https://waqt.io/widget.js" async></script>
 *
 * Injects an iframe → /embed/{slug}. postMessage bridges:
 *   waqt:resize            → auto-height
 *   waqt:booking-complete  → re-dispatched as a DOM CustomEvent
 *     ("waqt:booking-complete" on the container) for the host site.
 */
(function () {
  "use strict";

  var ORIGIN = (function () {
    try {
      var s = document.currentScript;
      return new URL(s.src).origin;
    } catch (e) {
      return "https://waqt.io";
    }
  })();

  function init() {
    var containers = document.querySelectorAll(
      "#waqt-widget[data-business], [data-waqt-business]"
    );
    for (var i = 0; i < containers.length; i++) mount(containers[i]);
  }

  function mount(el) {
    if (el.getAttribute("data-waqt-mounted")) return;
    el.setAttribute("data-waqt-mounted", "1");

    var slug =
      el.getAttribute("data-business") || el.getAttribute("data-waqt-business");
    if (!slug) return;

    var iframe = document.createElement("iframe");
    iframe.src = ORIGIN + "/embed/" + encodeURIComponent(slug);
    iframe.title = "Book an appointment";
    iframe.loading = "lazy";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.minHeight = "480px";
    iframe.style.display = "block";
    iframe.setAttribute("allowtransparency", "true");

    window.addEventListener("message", function (event) {
      if (event.origin !== ORIGIN) return; // only trust our own embed
      if (event.source !== iframe.contentWindow) return;
      var data = event.data || {};
      if (data.type === "waqt:resize" && typeof data.height === "number") {
        iframe.style.height = Math.max(320, data.height) + "px";
      } else if (data.type === "waqt:booking-complete") {
        el.dispatchEvent(
          new CustomEvent("waqt:booking-complete", {
            detail: data.booking || {},
            bubbles: true,
          })
        );
      }
    });

    el.appendChild(iframe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
