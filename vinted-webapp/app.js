const MAX_IMAGES = 8;
const MAX_IMAGE_DIMENSION = 1024; // Bilder werden vor dem Upload verkleinert, um Tokens zu sparen
const DEFAULT_MODEL = "gpt-5.6-luna";

const STORAGE_KEYS = {
  apiKey: "vinted_api_key",
  model: "vinted_model",
  lastResult: "vinted_last_result",
};

const els = {
  settingsToggle: document.getElementById("settingsToggle"),
  settings: document.getElementById("settings"),
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  saveSettings: document.getElementById("saveSettings"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  previews: document.getElementById("previews"),
  generateBtn: document.getElementById("generateBtn"),
  result: document.getElementById("result"),
  titleOut: document.getElementById("titleOut"),
  descOut: document.getElementById("descOut"),
  status: document.getElementById("status"),
};

/** @type {{dataUrl: string}[]} */
let images = [];

// ---------- Init ----------

(function init() {
  const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  els.model.value = localStorage.getItem(STORAGE_KEYS.model) || DEFAULT_MODEL;
  // Gespeichertes Modell, das nicht (mehr) in der Auswahlliste steht → auf Standard zurückfallen
  if (!els.model.value) {
    els.model.value = DEFAULT_MODEL;
    localStorage.setItem(STORAGE_KEYS.model, DEFAULT_MODEL);
  }
  if (apiKey) {
    els.apiKey.value = apiKey;
  } else {
    els.settings.classList.remove("hidden");
    showStatus("Bitte zuerst deinen OpenAI API-Key hinterlegen (⚙️).");
  }

  try {
    const lastResult = JSON.parse(localStorage.getItem(STORAGE_KEYS.lastResult) || "null");
    if (lastResult?.title) {
      els.titleOut.value = lastResult.title;
      els.descOut.value = lastResult.description || "";
      els.result.classList.remove("hidden");
    }
  } catch {
    // Ungültiger gespeicherter Zustand – ignorieren
  }

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();

// ---------- Einstellungen ----------

els.settingsToggle.addEventListener("click", () => {
  els.settings.classList.toggle("hidden");
});

els.saveSettings.addEventListener("click", () => {
  const key = els.apiKey.value.trim();
  if (!key.startsWith("sk-")) {
    showStatus("Das sieht nicht nach einem gültigen OpenAI API-Key aus.", "error");
    return;
  }
  localStorage.setItem(STORAGE_KEYS.apiKey, key);
  localStorage.setItem(STORAGE_KEYS.model, els.model.value || DEFAULT_MODEL);
  els.settings.classList.add("hidden");
  showStatus("Einstellungen gespeichert.", "success");
});

// ---------- Bild-Upload ----------

els.fileInput.addEventListener("change", () => addFiles(els.fileInput.files));

els.dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  els.dropzone.classList.add("dragover");
});
els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragover"));
els.dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  els.dropzone.classList.remove("dragover");
  addFiles(e.dataTransfer.files);
});

async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  for (const file of files) {
    if (images.length >= MAX_IMAGES) {
      showStatus(`Maximal ${MAX_IMAGES} Bilder.`, "error");
      break;
    }
    try {
      const dataUrl = await resizeImage(file);
      images.push({ dataUrl });
    } catch (e) {
      showStatus(`Fehler: ${e.message}`, "error");
    }
  }
  els.fileInput.value = "";
  renderPreviews();
}

function renderPreviews() {
  els.previews.innerHTML = "";
  images.forEach((img, i) => {
    const wrap = document.createElement("div");
    wrap.className = "thumb";
    const el = document.createElement("img");
    el.src = img.dataUrl;
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "×";
    remove.title = "Entfernen";
    remove.addEventListener("click", () => {
      images.splice(i, 1);
      renderPreviews();
    });
    wrap.append(el, remove);
    els.previews.appendChild(wrap);
  });
  els.generateBtn.disabled = images.length === 0;
}

/** Verkleinert ein Bild auf max. MAX_IMAGE_DIMENSION px und gibt eine JPEG-Data-URL zurück. */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Bild konnte nicht geladen werden: ${file.name}`));
    };
    img.src = url;
  });
}

// ---------- Generierung ----------

const SYSTEM_PROMPT = `Du bist ein Experte für Secondhand-Mode und schreibst verkaufsstarke Vinted-Anzeigen auf Deutsch.
Du bekommst mehrere Fotos desselben Kleidungsstücks und antwortest ausschließlich mit einem JSON-Objekt:
{"title": "...", "description": "..."}

Schau dir alle Fotos gründlich an, auch Etiketten, Waschzettel, Nähte, Knöpfe, Reißverschlüsse und Prints.

Regeln für den Titel (max. 60 Zeichen):
- Marke (falls erkennbar), Art des Kleidungsstücks, wichtigstes Merkmal (Farbe/Muster/Stil)
- Größe nur nennen, wenn sie auf einem Etikett klar lesbar ist

Regeln für die Beschreibung (ca. 80-140 Wörter, drei kurze Absätze):
1. Absatz – Was ist es: Art des Kleidungsstücks, Marke, Farbe(n), Muster, Schnitt/Stil (z. B. Oversized, tailliert, High-Waist). Material und Größe nur, wenn auf einem Etikett lesbar.
2. Absatz – Details und Zustand: Besonderheiten wie Taschen, Knöpfe, Reißverschlüsse, Kapuze, Prints, Stickereien, Waschung. Den Zustand ehrlich einschätzen (z. B. neuwertig, sehr gut, gut) und sichtbare Mängel wie Pilling, Flecken oder ausgeblichene Stellen klar benennen.
3. Absatz – Passform und Styling: Wie das Teil fällt bzw. wirkt und wozu es passt (Anlässe, Kombinationen, Jahreszeit).

Wichtig:
- Freundlicher, ehrlicher Ton, keine übertriebenen Verkaufsfloskeln
- Erfinde nichts, was auf den Fotos nicht erkennbar ist – lieber ein Detail weglassen als raten
- Keine Hashtags, keine Emojis, keine Anrede`;

els.generateBtn.addEventListener("click", async () => {
  const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  const model = localStorage.getItem(STORAGE_KEYS.model) || DEFAULT_MODEL;
  if (!apiKey) {
    els.settings.classList.remove("hidden");
    showStatus("Bitte zuerst deinen OpenAI API-Key hinterlegen.", "error");
    return;
  }

  els.generateBtn.disabled = true;
  showStatus('<span class="spinner"></span>KI analysiert die Bilder …', "", true);

  try {
    const content = [
      { type: "text", text: "Erstelle Titel und Beschreibung für dieses Kleidungsstück." },
      ...images.map((img) => ({
        type: "image_url",
        image_url: { url: img.dataUrl, detail: "low" },
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
        // max_completion_tokens statt max_tokens: Pflicht für die GPT-5-Familie,
        // funktioniert aber auch mit älteren Modellen wie gpt-4o.
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error?.message || `OpenAI-Fehler (HTTP ${response.status})`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    if (!result.title || !result.description) {
      throw new Error("Antwort enthielt keinen Titel/Beschreibung.");
    }

    els.titleOut.value = result.title;
    els.descOut.value = result.description;
    els.result.classList.remove("hidden");
    localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result));
    showStatus("Fertig! Texte kopieren und in der Vinted-App einfügen.", "success");
  } catch (e) {
    showStatus(`Fehler: ${e.message}`, "error");
  } finally {
    els.generateBtn.disabled = images.length === 0;
  }
});

// ---------- Kopieren ----------

document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const field = document.getElementById(btn.dataset.copy);
    const text = field.value.trim();
    if (!text) return;

    localStorage.setItem(
      STORAGE_KEYS.lastResult,
      JSON.stringify({ title: els.titleOut.value, description: els.descOut.value })
    );

    const ok = await copyToClipboard(text, field);
    if (ok) {
      const original = btn.textContent;
      btn.textContent = "✅ Kopiert";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1500);
    } else {
      showStatus("Kopieren fehlgeschlagen – bitte Text manuell markieren.", "error");
    }
  });
});

async function copyToClipboard(text, field) {
  // navigator.clipboard braucht einen Secure Context (HTTPS/localhost) –
  // beim Test über die lokale IP greift der execCommand-Fallback.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback unten versuchen
    }
  }
  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    field.blur();
    return ok;
  } catch {
    return false;
  }
}

// ---------- Status ----------

function showStatus(message, kind = "", asHtml = false) {
  els.status.classList.remove("hidden", "error", "success");
  if (kind) els.status.classList.add(kind);
  if (asHtml) {
    els.status.innerHTML = message;
  } else {
    els.status.textContent = message;
  }
}
