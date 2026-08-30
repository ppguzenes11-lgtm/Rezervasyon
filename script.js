// =========================================================
// KÜBBAN REZERVASYON - script.js
// =========================================================
// WhatsApp hedefi (numara veya grup linki) artık kod içinde sabit
// yazılmıyor; kullanıcı ilk açılışta ayarlar ve tarayıcının
// localStorage'ında saklanır. "Gönder" her basıldığında aynı hedef
// otomatik kullanılır, tekrar seçim yapılmaz. Hedef, ⚙️ butonundan
// istenildiği zaman değiştirilebilir.
//
// Kabul edilen değerler:
//   1) Bir telefon numarası (ülke koduyla), örn: "905301234567"
//      -> Mesaj doğrudan bu numaranın sohbetinde hazır olarak açılır.
//   2) "https://wa.me/..." veya "https://api.whatsapp.com/send..." linki
//      -> Aynı numaraya mesaj hazır şekilde eklenir.
//   3) "https://chat.whatsapp.com/..." gibi bir grup davet linki girilirse
//      mesaj panoya kopyalanır ve verilen grup linki doğrudan açılır
//      (WhatsApp, bir davet linkiyle doğrudan bir gruba hazır mesaj
//      göndermeyi desteklemediği için); kullanıcı tek dokunuşla mesajı
//      yapıştırıp WhatsApp'ın kendi gönder tuşuna basar.
//
// DEFAULT_WHATSAPP_TARGET: uygulamanın kutudan çıktığı gibi (hiçbir
// cihazda ayar yapılmadan) kullanacağı sabit hedef. Buraya bir kez
// yazınca tüm cihazlarda otomatik geçerli olur; ⚙️ ile bir cihazda
// farklı bir numara/link girilirse o cihazda bu varsayılanın önüne
// geçer (kişisel tercih, sadece o cihazda geçerlidir).
const DEFAULT_WHATSAPP_TARGET = "https://chat.whatsapp.com/HkFgG8HioSCBFkhNcyAZHw?s=cl&p=i&mlu=4";

const WHATSAPP_TARGET_STORAGE_KEY = "kubban_whatsapp_target";

const RESTAURANT_NAME = "KÜBBAN GAZİANTEP MUTFAĞI";

const TURKISH_MONTHS = [
  "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN",
  "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"
];

const TURKISH_DAYS = [
  "PAZAR", "PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMA", "CUMARTESİ"
];

const form = document.getElementById("reservationForm");

const fields = {
  customerName: document.getElementById("customerName"),
  date: document.getElementById("date"),
  time: document.getElementById("time"),
  guestCount: document.getElementById("guestCount"),
  phone: document.getElementById("phone"),
  location: document.getElementById("location")
};

const dateHint = document.getElementById("dateHint");

const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const targetInput = document.getElementById("targetInput");
const targetError = document.getElementById("err-target");
const saveTargetBtn = document.getElementById("saveTargetBtn");
const skipTargetBtn = document.getElementById("skipTargetBtn");

function getStoredTarget() {
  try {
    return (localStorage.getItem(WHATSAPP_TARGET_STORAGE_KEY) || "").trim();
  } catch (err) {
    return "";
  }
}

function getEffectiveTarget() {
  return getStoredTarget() || DEFAULT_WHATSAPP_TARGET.trim();
}

function saveTarget(value) {
  try {
    localStorage.setItem(WHATSAPP_TARGET_STORAGE_KEY, value.trim());
  } catch (err) {
    // localStorage kullanılamıyorsa (gizli sekme vb.) sessizce geç.
  }
}

function openSettings() {
  targetInput.value = getEffectiveTarget();
  targetInput.classList.remove("invalid");
  targetError.textContent = "";
  settingsOverlay.hidden = false;
  skipTargetBtn.hidden = !getEffectiveTarget();
  setTimeout(() => targetInput.focus(), 0);
}

function closeSettings() {
  settingsOverlay.hidden = true;
}

settingsBtn.addEventListener("click", openSettings);

skipTargetBtn.addEventListener("click", closeSettings);

saveTargetBtn.addEventListener("click", () => {
  const value = targetInput.value.trim();
  if (!value) {
    targetInput.classList.add("invalid");
    targetError.textContent = "Numara veya grup linki girilmelidir.";
    return;
  }
  saveTarget(value);
  closeSettings();
});

if (!getEffectiveTarget()) {
  openSettings();
}

function toUpperTr(value) {
  return value.trim().toLocaleUpperCase("tr-TR");
}

function formatDateTr(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayName = TURKISH_DAYS[dateObj.getDay()];
  const monthName = TURKISH_MONTHS[month - 1];
  return `${day} ${monthName} ${dayName}`;
}

function formatTimeTr(isoTime) {
  return isoTime.replace(":", ".");
}

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(isoDate) {
  return isoDate === todayIso() ? "BUGÜN" : formatDateTr(isoDate);
}

function updateDateHint() {
  dateHint.textContent = fields.date.value ? formatDateForDisplay(fields.date.value) : "";
}

if (!fields.date.value) {
  fields.date.value = todayIso();
}
updateDateHint();
fields.date.addEventListener("input", updateDateHint);

function clearErrors() {
  Object.keys(fields).forEach((key) => {
    fields[key].classList.remove("invalid");
    const errEl = document.getElementById(`err-${key}`);
    if (errEl) errEl.textContent = "";
  });
}

function showError(key, message) {
  fields[key].classList.add("invalid");
  const errEl = document.getElementById(`err-${key}`);
  if (errEl) errEl.textContent = message;
}

function validateForm() {
  clearErrors();
  let isValid = true;

  if (!fields.customerName.value.trim()) {
    showError("customerName", "Müşteri adı boş bırakılamaz.");
    isValid = false;
  }
  if (!fields.date.value) {
    showError("date", "Tarih seçilmelidir.");
    isValid = false;
  }
  if (!fields.time.value) {
    showError("time", "Saat seçilmelidir.");
    isValid = false;
  }
  if (!fields.guestCount.value || Number(fields.guestCount.value) <= 0) {
    showError("guestCount", "Kişi sayısı girilmelidir.");
    isValid = false;
  }
  if (!fields.phone.value.trim()) {
    showError("phone", "Telefon numarası boş bırakılamaz.");
    isValid = false;
  }
  if (!fields.location.value.trim()) {
    showError("location", "Yer bilgisi boş bırakılamaz.");
    isValid = false;
  }

  return isValid;
}

function buildMessage() {
  const name = toUpperTr(fields.customerName.value);
  const dateText = formatDateForDisplay(fields.date.value);
  const timeText = formatTimeTr(fields.time.value);
  const guestText = `${Number(fields.guestCount.value)} KİŞİ`;
  const phoneText = fields.phone.value.trim();
  const locationText = toUpperTr(fields.location.value);

  return (
    `🟢 Yeni Rezervasyon! · *${RESTAURANT_NAME}*\n\n` +
    `👤 :${name}\n` +
    `📅 :${dateText}\n` +
    `🕒 :${timeText}\n` +
    `👥 :${guestText}\n` +
    `📞 :${phoneText}\n` +
    `YER: ${locationText}`
  );
}

function isGroupInviteLink(value) {
  return /^https?:\/\/chat\.whatsapp\.com\//i.test(value);
}

function extractPhoneDigits(value) {
  const digits = value.replace(/[^0-9]/g, "");
  return digits || null;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}

async function sendToWhatsApp(message) {
  const target = getEffectiveTarget();

  if (!target) {
    openSettings();
    return;
  }

  // Grup davet linkleri WhatsApp tarafından mesaj ön-doldurmayı desteklemez;
  // bu yüzden mesaj panoya kopyalanır ve verilen grup linki doğrudan açılır,
  // kullanıcı sadece tek dokunuşla yapıştırıp gönderir.
  if (isGroupInviteLink(target)) {
    await copyToClipboard(message);
    window.open(target, "_blank", "noopener");
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const phoneDigits = extractPhoneDigits(target);
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank", "noopener");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const message = buildMessage();
  sendToWhatsApp(message);
});
