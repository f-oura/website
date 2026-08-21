(function () {
  "use strict";

  const root = document.documentElement;
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "summary",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  function closeDisclosure(details, returnFocus) {
    if (!details || !details.open) return;
    details.open = false;
    const summary = details.querySelector(":scope > summary");
    summary?.setAttribute("aria-expanded", "false");
    if (returnFocus) summary?.focus();
  }

  function initDisclosures() {
    const disclosures = Array.from(document.querySelectorAll("details[data-disclosure], details[data-mobile-menu]"));
    const mobileMenu = document.querySelector("details[data-mobile-menu]");

    disclosures.forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      if (!summary) return;

      summary.setAttribute("aria-expanded", details.open ? "true" : "false");
      details.addEventListener("toggle", () => {
        summary.setAttribute("aria-expanded", details.open ? "true" : "false");
        if (details === mobileMenu) {
          root.classList.toggle("nav-open", details.open);
        }
      });

      details.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => closeDisclosure(details, false));
      });
    });

    document.addEventListener("pointerdown", (event) => {
      disclosures.forEach((details) => {
        if (details.open && !details.contains(event.target)) closeDisclosure(details, false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        disclosures.forEach((details) => closeDisclosure(details, true));
        return;
      }

      if (event.key !== "Tab" || !mobileMenu?.open) return;
      const panel = mobileMenu.querySelector(".mobile-menu__panel");
      const focusable = panel ? Array.from(panel.querySelectorAll(focusableSelector)).filter((item) => item.offsetParent !== null) : [];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 67.51rem)").matches) closeDisclosure(mobileMenu, false);
    });
  }

  function initAppearanceLabels() {
    const buttons = document.querySelectorAll("[id^='appearance-switcher']");
    if (!buttons.length) return;

    const sync = () => {
      const dark = root.classList.contains("dark");
      buttons.forEach((button) => {
        const japanese = document.documentElement.lang.toLowerCase().startsWith("ja");
        button.setAttribute(
          "aria-label",
          japanese
            ? dark
              ? "明るい配色に切り替える"
              : "暗い配色に切り替える"
            : dark
              ? "Switch to light theme"
              : "Switch to dark theme",
        );
      });
    };

    sync();
    buttons.forEach((button) => {
      button.addEventListener("click", () => window.setTimeout(sync, 0));
    });
  }

  function initHadronSimulation() {
    const controls = document.querySelector("[data-hadron-controls]");
    const frame = document.querySelector(".hadron-background__frame");
    if (!controls || !frame) return;

    const toggle = controls.querySelector(".hadron-controls__toggle");
    const panel = controls.querySelector(".hadron-panel");
    const reset = controls.querySelector("[data-hadron-reset]");
    const baryons = controls.querySelector("#hadron-baryons");
    const mesons = controls.querySelector("#hadron-mesons");
    const speed = controls.querySelector("#hadron-speed");
    const baryonValue = controls.querySelector("#hadron-baryons-value");
    const mesonValue = controls.querySelector("#hadron-mesons-value");
    const speedValue = controls.querySelector("#hadron-speed-value");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideEnough = window.matchMedia("(min-width: 40rem)");
    let loaded = false;

    function originForFrame() {
      try {
        return new URL(frame.src || frame.dataset.src, window.location.href).origin;
      } catch (_error) {
        return window.location.origin;
      }
    }

    function sendConfig(config) {
      if (!loaded || !frame.contentWindow) return;
      frame.contentWindow.postMessage({ type: "hadron-config", ...config }, originForFrame());
    }

    function currentConfig(resetState) {
      return {
        baryons: Number.parseInt(baryons.value, 10),
        mesons: Number.parseInt(mesons.value, 10),
        speed: reduceMotion.matches ? 0 : (Number.parseFloat(speed.value) / 100) * 3,
        reset: Boolean(resetState),
      };
    }

    function updateValues() {
      baryonValue.value = baryons.value;
      baryonValue.textContent = baryons.value;
      mesonValue.value = mesons.value;
      mesonValue.textContent = mesons.value;
      speedValue.value = `${speed.value}%`;
      speedValue.textContent = `${speed.value}%`;
    }

    function loadFrame() {
      if (loaded || reduceMotion.matches || !wideEnough.matches || !root.classList.contains("dark")) return;
      frame.src = frame.dataset.src;
    }

    frame.addEventListener("load", () => {
      loaded = true;
      sendConfig(currentConfig(true));
    });

    const scheduleLoad = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadFrame, { timeout: 1200 });
      } else {
        window.setTimeout(loadFrame, 250);
      }
    };
    scheduleLoad();

    toggle.addEventListener("click", () => {
      const opening = panel.hidden;
      panel.hidden = !opening;
      toggle.setAttribute("aria-expanded", opening ? "true" : "false");
      if (opening) baryons.focus();
    });

    [baryons, mesons, speed].forEach((input) => {
      input.addEventListener("input", () => {
        updateValues();
        sendConfig(currentConfig(input !== speed));
      });
    });

    reset.addEventListener("click", () => {
      baryons.value = "7";
      mesons.value = "5";
      speed.value = "40";
      updateValues();
      sendConfig(currentConfig(true));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!panel.hidden && !controls.contains(event.target)) {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) sendConfig({ speed: 0 });
      else if (!loaded) scheduleLoad();
      else sendConfig(currentConfig(false));
    });

    wideEnough.addEventListener("change", () => {
      if (wideEnough.matches && !loaded) scheduleLoad();
      if (!wideEnough.matches) sendConfig({ speed: 0 });
    });

    document.querySelectorAll("[id^='appearance-switcher']").forEach((button) => {
      button.addEventListener("click", () => {
        window.setTimeout(() => {
          if (root.classList.contains("dark")) {
            if (!loaded) scheduleLoad();
            else sendConfig(currentConfig(false));
          } else {
            sendConfig({ speed: 0 });
          }
        }, 0);
      });
    });

    updateValues();
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = form.querySelector("[data-contact-status]");
    const japanese = document.documentElement.lang.toLowerCase().startsWith("ja");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const to = form.dataset.contactTo;
      const name = form.elements.namedItem("name")?.value.trim() ?? "";
      const email = form.elements.namedItem("email")?.value.trim() ?? "";
      const subject = form.elements.namedItem("subject")?.value.trim() || (japanese ? "ウェブサイトからの問い合わせ" : "Inquiry from the website");
      const message = form.elements.namedItem("message")?.value.trim() ?? "";
      const body = japanese
        ? `お名前: ${name}\n返信先: ${email}\n\n${message}`
        : `Name: ${name}\nReply-to: ${email}\n\n${message}`;
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
      if (status) {
        status.hidden = false;
        status.textContent = japanese
          ? "メールアプリが開かない場合は、上記の機関メールへ直接ご連絡ください。"
          : "If your email app does not open, please write directly to the institutional address above.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDisclosures();
    initAppearanceLabels();
    initHadronSimulation();
    initContactForm();
  });
})();
