// Content Script: trägt Titel und Beschreibung ins Vinted-Verkaufsformular ein.
// Vinted ist eine React-App – ein einfaches `el.value = ...` würde vom React-State
// sofort überschrieben. Deshalb wird der native Value-Setter benutzt und danach
// ein echtes input-Event ausgelöst, damit React die Änderung übernimmt.

(() => {
  if (window.__vintedAssistantLoaded) return;
  window.__vintedAssistantLoaded = true;

  const TITLE_SELECTORS = [
    'input[data-testid="title--input"]',
    'input[name="title"]',
    "input#title",
    'input[id*="title" i]',
  ];

  const DESCRIPTION_SELECTORS = [
    'textarea[data-testid="description--input"]',
    'textarea[name="description"]',
    "textarea#description",
    'textarea[id*="description" i]',
  ];

  function findField(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;

    el.focus();
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "FILL_LISTING") return;

    const titleField = findField(TITLE_SELECTORS);
    const descField = findField(DESCRIPTION_SELECTORS);

    if (!titleField && !descField) {
      sendResponse({
        ok: false,
        error: "Kein Titel-/Beschreibungsfeld gefunden. Öffne das Vinted-Verkaufsformular („Verkaufen“).",
      });
      return;
    }

    if (titleField && msg.title) setNativeValue(titleField, msg.title);
    if (descField && msg.description) setNativeValue(descField, msg.description);

    sendResponse({ ok: true });
  });
})();
