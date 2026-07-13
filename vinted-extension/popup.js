const MAX_IMAGES = 8;
const MAX_IMAGE_DIMENSION = 1536; // groß genug, damit die KI Etiketten (Größe, Material, Herkunft) lesen kann
const DEFAULT_MODEL = "gpt-5.6-luna";

const els = {
  settingsToggle: document.getElementById("settingsToggle"),
  settings: document.getElementById("settings"),
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  saveKey: document.getElementById("saveKey"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  previews: document.getElementById("previews"),
  generateBtn: document.getElementById("generateBtn"),
  result: document.getElementById("result"),
  titleOut: document.getElementById("titleOut"),
  descOut: document.getElementById("descOut"),
  fillBtn: document.getElementById("fillBtn"),
  resetBtn: document.getElementById("resetBtn"),
  status: document.getElementById("status"),
};

/** @type {{file: File, dataUrl: string}[]} */
let images = [];

// ---------- Init ----------

chrome.storage.local.get(["apiKey", "model", "lastResult"]).then(({ apiKey, model, lastResult }) => {
  els.model.value = model || DEFAULT_MODEL;
  // Gespeichertes Modell, das nicht (mehr) in der Auswahlliste steht → auf Standard zurückfallen
  if (!els.model.value) {
    els.model.value = DEFAULT_MODEL;
    chrome.storage.local.set({ model: DEFAULT_MODEL });
  }
  if (apiKey) {
    els.apiKey.value = apiKey;
  } else {
    els.settings.classList.remove("hidden");
    showStatus("Bitte zuerst deinen OpenAI API-Key hinterlegen (⚙️).");
  }
  // Letztes Ergebnis wiederherstellen, damit es beim Schließen des Popups nicht verloren geht
  if (lastResult?.title) {
    els.titleOut.value = lastResult.title;
    els.descOut.value = lastResult.description || "";
    els.result.classList.remove("hidden");
    updateResetVisibility();
  }
});

// ---------- Einstellungen ----------

els.settingsToggle.addEventListener("click", () => {
  els.settings.classList.toggle("hidden");
});

els.saveKey.addEventListener("click", async () => {
  const key = els.apiKey.value.trim();
  if (!key.startsWith("sk-")) {
    showStatus("Das sieht nicht nach einem gültigen OpenAI API-Key aus.", "error");
    return;
  }
  await chrome.storage.local.set({
    apiKey: key,
    model: els.model.value || DEFAULT_MODEL,
  });
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
    const dataUrl = await resizeImage(file);
    images.push({ file, dataUrl });
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
  updateResetVisibility();
}

function updateResetVisibility() {
  const hasContent = images.length > 0 || !els.result.classList.contains("hidden");
  els.resetBtn.classList.toggle("hidden", !hasContent);
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

// ---------- Generierung mit GPT-4o ----------

const SYSTEM_PROMPT = `Du bist ein Experte für Secondhand-Mode und schreibst verkaufsstarke Vinted-Anzeigen auf Deutsch.
Du bekommst mehrere Fotos desselben Kleidungsstücks und antwortest ausschließlich mit einem JSON-Objekt:
{"title": "...", "description": "..."}

Schau dir alle Fotos gründlich an. Lies Etiketten und Waschzettel genau – dort stehen oft Größe, Material und Herstellungsland.

Regeln für den Titel (max. 60 Zeichen, keyword-optimiert für die Vinted-Suche):
- Reihenfolge: Marke, Art des Kleidungsstücks, Herren/Damen (falls eindeutig), "Gr. X" (falls auf Etikett lesbar), Farbe(n), Material (falls lesbar)
- Beispiel: "HUGO BOSS Poloshirt Herren Gr. M Schwarz Dunkelblau Baumwolle"

Aufbau der Beschreibung (drei Teile, durch Leerzeilen getrennt):
1. Ein Fließtext-Absatz (60-100 Wörter): was es genau ist, Marke, Farben/Muster, auffällige Details (z. B. Kragen, Knopfleiste, gesticktes Logo, Prints, Taschen), ehrliche Zustandseinschätzung inklusive sichtbarer Mängel (z. B. Pilling, Flecken), und wozu es passt (Anlässe, Styling).
2. Eine Steckbrief-Liste, eine Angabe pro Zeile, im Format "Marke: ...". Mögliche Zeilen: Marke, Größe, Farbe, Material, Hergestellt in, Passform, Zustand. Nimm nur Zeilen auf, deren Wert auf den Fotos sicher erkennbar ist – lass unbekannte Zeilen komplett weg.
3. Als letzte Zeile exakt: "Bei Fragen oder Interesse einfach melden. Versand und Bundle-Rabatt möglich."

Wichtig:
- Freundlicher, ehrlicher Ton, keine übertriebenen Verkaufsfloskeln
- Erfinde nichts, was auf den Fotos nicht erkennbar ist – lieber ein Detail weglassen als raten
- Keine Hashtags, keine Emojis, keine Anrede`;

els.generateBtn.addEventListener("click", async () => {
  const { apiKey, model } = await chrome.storage.local.get(["apiKey", "model"]);
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
      // detail "high", damit Etiketten lesbar sind – mit "low" wird das Bild
      // API-seitig so stark verkleinert, dass Größe/Material nicht erkannt werden
      ...images.map((img) => ({
        type: "image_url",
        image_url: { url: img.dataUrl, detail: "high" },
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
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
      const raw = err?.error?.message || `OpenAI-Fehler (HTTP ${response.status})`;
      if (/verif|permission|not have access|model_not_found/i.test(raw)) {
        throw new Error(
          "Dein OpenAI-Konto hat keinen Zugriff auf dieses Modell. Wähle im ⚙️-Menü ein anderes Modell."
        );
      }
      throw new Error(raw);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    if (!result.title || !result.description) {
      throw new Error("Antwort enthielt keinen Titel/Beschreibung.");
    }

    els.titleOut.value = result.title;
    els.descOut.value = result.description;
    els.result.classList.remove("hidden");
    await chrome.storage.local.set({ lastResult: result });
    showStatus("Fertig! Du kannst den Text noch anpassen und dann eintragen.", "success");
  } catch (e) {
    showStatus(`Fehler: ${e.message}`, "error");
  } finally {
    els.generateBtn.disabled = images.length === 0;
  }
});

// ---------- Zurücksetzen ----------

els.resetBtn.addEventListener("click", async () => {
  images = [];
  els.fileInput.value = "";
  els.titleOut.value = "";
  els.descOut.value = "";
  els.result.classList.add("hidden");
  await chrome.storage.local.remove("lastResult");
  renderPreviews();
  showStatus("Bereit für das nächste Kleidungsstück.", "success");
});

// ---------- In Vinted eintragen ----------

els.fillBtn.addEventListener("click", async () => {
  const title = els.titleOut.value.trim();
  const description = els.descOut.value.trim();
  if (!title && !description) return;
  await chrome.storage.local.set({ lastResult: { title, description } });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/https:\/\/[^/]*vinted\./.test(tab.url)) {
    showStatus("Bitte öffne zuerst das Vinted-Verkaufsformular (vinted.de → Verkaufen) im aktiven Tab.", "error");
    return;
  }

  try {
    let response = await sendFillMessage(tab.id, title, description);
    if (!response?.ok) {
      throw new Error(response?.error || "Formularfelder nicht gefunden. Bist du auf der Seite „Verkaufen“?");
    }
    showStatus("Titel und Beschreibung wurden in Vinted eingetragen. ✅", "success");
  } catch (e) {
    showStatus(`Fehler: ${e.message}`, "error");
  }
});

async function sendFillMessage(tabId, title, description) {
  const msg = { type: "FILL_LISTING", title, description };
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    // Content Script noch nicht geladen (z. B. Extension nach dem Öffnen des Tabs installiert) → nachträglich injizieren
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    return chrome.tabs.sendMessage(tabId, msg);
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
