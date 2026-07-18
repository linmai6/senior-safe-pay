const products = {
  coffee: { code: "coffee", store: "想要分享咖啡", item: "熱美式咖啡", price: 50, icon: "☕", expected: 50 },
  bread: { code: "bread", store: "麥麥早餐店", item: "蔥燒大餅", price: 45, icon: "🫓", expected: 45 },
  pickle: { code: "pickle", store: "客家好味道", item: "炒酸菜", price: 180, icon: "🥬", expected: 180 },
  ticket: { code: "ticket", store: "智慧交通站", item: "模擬車票", price: 60, icon: "🎫", expected: 60 },
  trap: { code: "trap", store: "想要分享咖啡", item: "熱美式咖啡", price: 500, icon: "⚠️", expected: 50, isTrap: true }
};

let currentProduct = null;
let speechEnabled = true;
let pin = "";
let stream = null;
let scanTimer = null;

const screens = [...document.querySelectorAll(".screen")];
const homeBtn = document.getElementById("homeBtn");
const soundBtn = document.getElementById("soundBtn");
const productList = document.getElementById("productList");
const storeCheck = document.getElementById("storeCheck");
const amountCheck = document.getElementById("amountCheck");
const confirmPayBtn = document.getElementById("confirmPayBtn");

function showScreen(name) {
  stopScanner();
  screens.forEach(s => s.classList.toggle("active", s.id === `screen-${name}`));
  homeBtn.classList.toggle("hidden", name === "home");
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("app").focus({ preventScroll: true });
}

function speak(text) {
  if (!speechEnabled || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-TW";
  utter.rate = 0.82;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}

function renderProducts() {
  productList.innerHTML = Object.values(products)
    .filter(p => !p.isTrap)
    .map(p => `
      <button class="product-btn" data-code="${p.code}">
        <span class="product-icon">${p.icon}</span>
        <span><b>${p.store}</b><span>${p.item}</span></span>
        <strong>NT$ ${p.price}</strong>
      </button>
    `).join("");
}

function selectProduct(code) {
  const p = products[code];
  if (!p) {
    alert("找不到這個商品代碼，請重新輸入。");
    return;
  }
  currentProduct = p;
  document.getElementById("merchantIcon").textContent = p.icon;
  document.getElementById("merchantName").textContent = p.store;
  document.getElementById("itemName").textContent = p.item;
  document.getElementById("amount").textContent = p.price;
  document.getElementById("alertBox").classList.toggle("hidden", !p.isTrap);
  document.getElementById("alertBox").textContent = p.isTrap
    ? "注意：商品原價 50 元，但畫面顯示 500 元。請找出問題！"
    : "";
  storeCheck.checked = false;
  amountCheck.checked = false;
  confirmPayBtn.disabled = true;
  showScreen("confirm");
  speak(`請確認店家名稱，${p.store}。付款金額，${p.price}元。`);
}

function updateConfirmState() {
  confirmPayBtn.disabled = !(storeCheck.checked && amountCheck.checked);
}

function buildKeypad() {
  const keys = ["1","2","3","4","5","6","7","8","9","清除","0","⌫"];
  document.getElementById("keypad").innerHTML = keys.map(k =>
    `<button class="key-btn" data-key="${k}">${k}</button>`
  ).join("");
}

function updatePin() {
  [...document.querySelectorAll("#pinDots span")].forEach((dot, i) =>
    dot.classList.toggle("filled", i < pin.length)
  );
  document.getElementById("pinDots").setAttribute("aria-label", `已輸入 ${pin.length} 位`);
  if (pin.length === 4) setTimeout(completePayment, 250);
}

function beginVerification() {
  if (!currentProduct) return;
  if (currentProduct.isTrap) {
    document.getElementById("problemMessage").textContent =
      "金額不正確：原價 50 元，付款頁面卻顯示 500 元。這筆付款已取消，不會扣款。";
    showScreen("problem");
    speak("您發現金額有問題。這筆付款已取消，不會扣款。");
    return;
  }
  pin = "";
  updatePin();
  showScreen("verify");
  speak("請輸入四位數練習密碼。真實付款時，不要把密碼告訴別人。");
}

function completePayment() {
  if (!currentProduct) return;
  const now = new Date();
  const tx = `SP${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(100000+Math.random()*900000)}`;
  const timeText = now.toLocaleString("zh-TW", { hour12: false });

  document.getElementById("successMerchant").textContent = currentProduct.store;
  document.getElementById("successAmount").textContent = `NT$ ${currentProduct.price}`;
  document.getElementById("receiptTime").textContent = timeText;
  document.getElementById("receiptMerchant").textContent = currentProduct.store;
  document.getElementById("receiptItem").textContent = currentProduct.item;
  document.getElementById("receiptAmount").textContent = `NT$ ${currentProduct.price}`;
  document.getElementById("receiptNo").textContent = tx;
  showScreen("success");
  speak(`付款成功。店家，${currentProduct.store}。金額，${currentProduct.price}元。請勿重複付款。`);
}

async function startScanner() {
  showScreen("scanner");
  const status = document.getElementById("scannerStatus");
  const video = document.getElementById("scannerVideo");
  status.textContent = "正在開啟相機⋯";

  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "此瀏覽器無法使用相機，請改用下方商品代碼。";
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    status.textContent = "請將 QR Code 放入框內";

    if ("BarcodeDetector" in window) {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      scanTimer = setInterval(async () => {
        try {
          const codes = await detector.detect(video);
          if (codes.length) {
            const raw = codes[0].rawValue.trim();
            const code = parseCode(raw);
            stopScanner();
            selectProduct(code);
          }
        } catch (_) {}
      }, 700);
    } else {
      status.textContent = "此瀏覽器不支援自動辨識，請改用下方商品代碼。";
    }
  } catch (err) {
    status.textContent = "相機未開啟。請允許相機權限，或改用下方商品代碼。";
  }
}

function parseCode(raw) {
  try {
    const url = new URL(raw);
    return url.searchParams.get("code") || raw;
  } catch (_) {
    try {
      const obj = JSON.parse(raw);
      return obj.code || raw;
    } catch (_) {
      return raw.toLowerCase();
    }
  }
}

function stopScanner() {
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  const video = document.getElementById("scannerVideo");
  if (video) video.srcObject = null;
}

document.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  const productEl = e.target.closest("[data-code]");
  const keyEl = e.target.closest("[data-key]");

  if (productEl) selectProduct(productEl.dataset.code);

  if (keyEl) {
    const key = keyEl.dataset.key;
    if (key === "清除") pin = "";
    else if (key === "⌫") pin = pin.slice(0, -1);
    else if (pin.length < 4) pin += key;
    updatePin();
  }

  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === "start" || action === "again") showScreen("select");
  if (action === "home") showScreen("home");
  if (action === "open-scanner") startScanner();
  if (action === "stop-scanner") showScreen("select");
  if (action === "trap") selectProduct("trap");
  if (action === "confirm-payment") beginVerification();
  if (action === "report-problem") {
    document.getElementById("problemMessage").textContent =
      currentProduct?.isTrap
        ? "金額不正確：原價 50 元，付款頁面卻顯示 500 元。這筆付款已取消，不會扣款。"
        : "您選擇停止付款。遇到不確定的店家或金額，先取消是正確做法。";
    showScreen("problem");
    speak("付款已取消，不會扣款。遇到不確定的情況，先停止是正確做法。");
  }
  if (action === "fingerprint") completePayment();
  if (action === "manual-code") {
    const raw = document.getElementById("manualCode").value.trim();
    selectProduct(parseCode(raw));
  }
});

storeCheck.addEventListener("change", updateConfirmState);
amountCheck.addEventListener("change", updateConfirmState);

homeBtn.addEventListener("click", () => showScreen("home"));
soundBtn.addEventListener("click", () => {
  speechEnabled = !speechEnabled;
  soundBtn.textContent = speechEnabled ? "🔊" : "🔇";
  soundBtn.setAttribute("aria-label", speechEnabled ? "關閉語音" : "開啟語音");
  if (speechEnabled) speak("語音提示已開啟");
});

window.addEventListener("beforeunload", stopScanner);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}

renderProducts();
buildKeypad();
