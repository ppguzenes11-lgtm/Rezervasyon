// =========================================================
// KÜBBAN REZERVASYON - script.js
// =========================================================
// Buraya rezervasyon mesajlarının gönderileceği WhatsApp hedefini girin.
// Kabul edilen değerler:
//   1) Bir telefon numarası (ülke koduyla), örn: "905301234567"
//      -> Mesaj doğrudan bu numaranın sohbetinde hazır olarak açılır.
//   2) "https://wa.me/..." veya "https://api.whatsapp.com/send..." linki
//      -> Aynı numaraya mesaj hazır şekilde eklenir.
//   3) Boş bırakılırsa ("") WhatsApp'ın kişi/grup seçme ekranı açılır,
//      kullanıcı mesajı göndereceği sohbeti (grubu) kendisi seçer.
//      (WhatsApp, tarayıcıdan bir davet linkiyle doğrudan bir gruba
//      hazır mesaj göndermeyi desteklemediği için en güvenilir yöntem budur.)
//   4) "https://chat.whatsapp.com/..." gibi bir grup davet linki girilirse,
//      mesaj panoya kopyalanır ve grup linki yeni sekmede açılır; kullanıcı
//      mesajı grup içine yapıştırıp gönderir.
const WHATSAPP_GROUP_LINK = "";

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
  const dateText = formatDateTr(fields.date.value);
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
  const target = WHATSAPP_GROUP_LINK.trim();

  if (target && isGroupInviteLink(target)) {
    const copied = await copyToClipboard(message);
    alert(
      copied
        ? "Mesaj panoya kopyalandı. Açılan grup sohbetine yapıştırıp gönderin."
        : "Mesajı panoya kopyalayamadık. Açılan grup sohbetine mesajı elle yapıştırın."
    );
    window.open(target, "_blank", "noopener");
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  let whatsappUrl;

  if (target) {
    const phoneDigits = extractPhoneDigits(target);
    whatsappUrl = phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
  } else {
    whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  }

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
