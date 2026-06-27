// ==============================================
//  updateTier.gs  (รวมไฟล์: Tier update + นับคลิป + Mark ซ้ำ)
//
//  หมายเหตุ: ไฟล์นี้ไม่ได้รันใน Next.js — ต้องนำไปวางใน
//  Google Apps Script (Extensions > Apps Script) ของ
//  Google Sheet ที่ใช้เป็น DB ของโปรเจคนี้โดยตรง
// ==============================================

// ---------- CONFIG: Tier ----------
var TIER_TIKTOK_COL   = 6;   // Col F = ชื่อบัญชี TikTok
var TIER_PHONE_COL    = 4;   // Col D = เบอร์โทรศัพท์
var TIER_SALE_JK_COL   = 8;  // Col H = Tiktok JK (ยอด)
var TIER_SALE_JKKP_COL = 9;  // Col I = Tiktok JKกพ (ยอด)
var TIER_SHOPEE_COL    = 10; // Col J = Shopee (ยอด) — ยังกรอกมือ
var TIER_SALES_COL    = 12;  // Col L = ยอดขายรวม 3 ช่อง
var TIER_TIER_COL     = 11;  // Col K = Tier Dropdown
var TIER_CLIPS_COL    = 13;  // Col M = จำนวนคลิปสะสม
var TIER_REVIEW_COL   = 15;  // Col O = ตรวจสอบยอด TikTok (เขียนโดย import script เท่านั้น
                              // — แยกจาก Col N เพราะ Col N มี dropdown ตายตัว "ลงทะเบียนซ้ำ"
                              // ของสคริปต์ Mark ซ้ำ ห้ามใช้ปนกัน)

// ⚠️ ชื่อ Tier ต้องตรงกับ Dropdown ใน Col K ทุกตัวอักษร
var TIER_RULES = [
  { min: 200000, tier: "Star⭐"  },
  { min:  50000, tier: "Super🚀" },
  { min:  10000, tier: "Speed⚡" },
  { min:      0, tier: "Start🚩" },
];

var MONTH_SHEETS = {
  1:  "Tierlist_Jan", 2:  "Tierlist_Feb",
  3:  "Tierlist_Mar", 4:  "Tierlist_Apr",
  5:  "Tierlist_May", 6:  "Tierlist_Jun",
  7:  "Tierlist_Jul", 8:  "Tierlist_Aug",
  9:  "Tierlist_Sep", 10: "Tierlist_Oct",
  11: "Tierlist_Nov", 12: "Tierlist_Dec"
};

var PREV_MONTH_MAP = {
  1:  "Tierlist_Dec", 2:  "Tierlist_Jan",
  3:  "Tierlist_Feb", 4:  "Tierlist_Mar",
  5:  "Tierlist_Apr", 6:  "Tierlist_May",
  7:  "Tierlist_Jun", 8:  "Tierlist_Jul",
  9:  "Tierlist_Aug", 10: "Tierlist_Sep",
  11: "Tierlist_Oct", 12: "Tierlist_Nov"
};

// ---------- CONFIG: นับคลิป (4 sheet ของแต่ละ Tier) ----------
var FORM_SOURCES = [
  { name: "Start", id: "1R1YT3xKK6ZuqPIrKqcPAjknBhCFtSqHqRDpGOJDk2dI", tab: "การตอบแบบฟอร์ม 1",
    tiktokCol: 2, clipsCol: 8, timeCol: 1 },

  { name: "Speed", id: "1Vooz_oHLq2uEeiDAuBETYfBAu9Kg-okJHign0N0hOxI", tab: "การตอบแบบฟอร์ม 1",
    tiktokCol: 3, clipsCol: 8, timeCol: 1 },

  { name: "Super", id: "19vonXEx-G5QRuYqUhE8eY28K2MLtPCBoYXReq2Nubgc", tab: "การตอบแบบฟอร์ม 1",
    tiktokCol: 3, clipsCol: 8, timeCol: 1 },

  { name: "Star",  id: "1MAncuF73XwmOQeg8aj0sW7sb5D0C2MTlcDxd8yKQUAA",  tab: "การตอบแบบฟอร์ม 1",
    tiktokCol: 3, clipsCol: 8, timeCol: 1 }
];

// ---------- CONFIG: Mark ซ้ำ ----------
var TIER_NOTE_COL  = 14;             // Col N = หมายเหตุ
var TIER_NOTE_DUPL = "ลงทะเบียนซ้ำ"; // ⚠️ ต้องตรงกับ Dropdown ใน Col N ทุกตัวอักษร


// ==============================================
//  MENU (รวมเดียว — ไม่มีไฟล์ onOpen ซ้ำแล้ว)
// ==============================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🔄 Clip Sync")
    .addItem("▶ อัปเดตทุกเดือน (นับคลิป)",          "updateAllMonths")
    .addItem("▶ อัปเดตเดือนปัจจุบัน (นับคลิป)",       "updateCurrentMonth")
    .addSeparator()
    .addItem("💰 Import ยอดขาย TikTok JK",            "importTiktokSalesJK")
    .addItem("💰 Import ยอดขาย TikTok JKกพ",           "importTiktokSalesJKKP")
    .addSeparator()
    .addItem("🏆 อัปเดต Tier (เดือนก่อน → เดือนนี้)", "updateTierFromPrevMonth")
    .addItem("🏆 อัปเดต Tier (ระบุ Sheet เอง)",        "updateTierManual")
    .addSeparator()
    .addItem("🔖 Mark ซ้ำ (ทุก Sheet)",               "markDuplicatesAllSheets")
    .addItem("🔖 Mark ซ้ำ (Sheet นี้)",                "markDuplicatesCurrentSheet")
    .addSeparator()
    .addItem("⏰ เปิด Auto นับคลิป (ทุก 1 ชม.)",       "setupTrigger")
    .addItem("⛔ ปิด Auto นับคลิป",                    "removeTrigger")
    .addToUi();
}


// ==============================================
//  TIER — อัปเดตอัตโนมัติ (เดือนก่อน → เดือนนี้)
// ==============================================
function updateTierFromPrevMonth() {
  var thisMonth = new Date().getMonth() + 1;
  var srcName   = PREV_MONTH_MAP[thisMonth];
  var dstName   = MONTH_SHEETS[thisMonth];

  if (!srcName || !dstName) {
    _alert("❌ หาชื่อ Sheet ไม่ได้ ตรวจสอบ MONTH_SHEETS / PREV_MONTH_MAP");
    return;
  }
  _runUpdateTier(srcName, dstName);
}

function updateTierManual() {
  var ui = SpreadsheetApp.getUi();

  var srcRes = ui.prompt(
    "🏆 อัปเดต Tier (Manual)",
    "ชื่อ Sheet ต้นทาง (เดือนก่อน) เช่น Tierlist_May",
    ui.ButtonSet.OK_CANCEL
  );
  if (srcRes.getSelectedButton() !== ui.Button.OK) return;

  var dstRes = ui.prompt(
    "🏆 อัปเดต Tier (Manual)",
    "ชื่อ Sheet ปลายทาง (เดือนนี้) เช่น Tierlist_Jun",
    ui.ButtonSet.OK_CANCEL
  );
  if (dstRes.getSelectedButton() !== ui.Button.OK) return;

  _runUpdateTier(
    srcRes.getResponseText().trim(),
    dstRes.getResponseText().trim()
  );
}

function _runUpdateTier(srcSheetName, dstSheetName) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheetByName(srcSheetName);
  var dst = ss.getSheetByName(dstSheetName);

  if (!src) { _alert("❌ ไม่พบ Sheet: " + srcSheetName); return; }
  if (!dst) { _alert("❌ ไม่พบ Sheet: " + dstSheetName); return; }

  var srcLastRow = src.getLastRow();
  if (srcLastRow < 2) { _alert("⚠️ ไม่มีข้อมูลใน " + srcSheetName); return; }

  var srcData = src.getRange(2, 1, srcLastRow - 1, TIER_SALES_COL).getValues();

  var salesMap = {};
  var keyMeta  = {};

  srcData.forEach(function(row) {
    var tiktok = _normalize(String(row[TIER_TIKTOK_COL - 1]));
    var phone  = _normalizePhone(String(row[TIER_PHONE_COL - 1]));
    var sales  = parseFloat(row[TIER_SALES_COL - 1]) || 0;

    var key = phone || tiktok;
    if (!key) return;

    if (salesMap[key] === undefined || sales > salesMap[key]) {
      salesMap[key] = sales;
      keyMeta[key]  = { tiktok: tiktok, phone: phone };
    }
  });

  Logger.log("[updateTier] Unique persons (after dedup): " + Object.keys(salesMap).length);

  var tiktokMap = {};
  var phoneMap  = {};
  var ruleCount = {};
  TIER_RULES.forEach(function(r) { ruleCount[r.tier] = 0; });

  Object.keys(salesMap).forEach(function(key) {
    var maxSales = salesMap[key];
    var meta     = keyMeta[key];
    var tier     = _calcTier(maxSales);

    ruleCount[tier] = (ruleCount[tier] || 0) + 1;
    if (meta.tiktok) tiktokMap[meta.tiktok] = tier;
    if (meta.phone)  phoneMap[meta.phone]   = tier;
  });

  Logger.log("[updateTier] tiktokMap: " + Object.keys(tiktokMap).length +
             " | phoneMap: " + Object.keys(phoneMap).length);

  var dstLastRow = dst.getLastRow();
  if (dstLastRow < 2) { _alert("⚠️ ไม่มีข้อมูลใน " + dstSheetName); return; }

  var dstData = dst.getRange(2, 1, dstLastRow - 1, TIER_TIKTOK_COL).getValues();

  var updated       = 0;
  var matchedTiktok = 0;
  var matchedPhone  = 0;
  var notMatched    = 0;

  for (var r = 0; r < dstData.length; r++) {
    var dstPhone  = _normalizePhone(String(dstData[r][TIER_PHONE_COL - 1]));
    var dstTiktok = String(dstData[r][TIER_TIKTOK_COL - 1]);

    var tier = "";
    var how  = "";

    tier = _matchByTiktok(dstTiktok, tiktokMap);
    if (tier) { how = "tiktok"; matchedTiktok++; }

    if (!tier && dstPhone && phoneMap[dstPhone]) {
      tier = phoneMap[dstPhone];
      how  = "phone";
      matchedPhone++;
    }

    if (tier) {
      dst.getRange(r + 2, TIER_TIER_COL).setValue(tier);
      updated++;
      Logger.log("  Row " + (r+2) + " matched by " + how + " → " + tier);
    } else {
      notMatched++;
    }
  }

  var tierSummary = TIER_RULES.map(function(r) {
    return "   " + r.tier + " : " + (ruleCount[r.tier] || 0);
  }).join("\n");

  var summary =
    "✅ updateTier เสร็จ!\n\n" +
    "📖 ต้นทาง : " + srcSheetName + "\n" +
    "📝 ปลายทาง: " + dstSheetName + "\n" +
    "🔄 อัปเดต : " + updated + " rows\n" +
    "   └ TikTok match : " + matchedTiktok + "\n" +
    "   └ เบอร์โทร match: " + matchedPhone + "\n" +
    "➖ ไม่ตรง  : " + notMatched + " rows\n\n" +
    "📊 สรุป Tier:\n" + tierSummary;

  _logToSheet("updateTier",
    srcSheetName + " → " + dstSheetName +
    " | updated: " + updated +
    " (tiktok:" + matchedTiktok + "/phone:" + matchedPhone + ")");

  _alert(summary);
}

function _calcTier(sales) {
  for (var i = 0; i < TIER_RULES.length; i++) {
    if (sales > TIER_RULES[i].min) return TIER_RULES[i].tier;
  }
  return TIER_RULES[TIER_RULES.length - 1].tier;
}

function _matchByTiktok(cellRaw, tiktokMap) {
  var parts = cellRaw.split(/[\/,]+/);
  for (var i = 0; i < parts.length; i++) {
    var norm = _normalize(parts[i]);
    if (!norm) continue;

    if (tiktokMap[norm]) return tiktokMap[norm];

    var keys = Object.keys(tiktokMap);
    for (var j = 0; j < keys.length; j++) {
      if (keys[j].length > 3 && norm.length > 3) {
        if (keys[j].indexOf(norm) !== -1 || norm.indexOf(keys[j]) !== -1) {
          return tiktokMap[keys[j]];
        }
      }
    }
  }
  return "";
}


// ==============================================
//  IMPORT ยอดขาย TikTok — จาก Creator List ที่ดาวน์โหลดจาก TikTok Shop
//  (เปิดไฟล์ xlsx เป็น Google Sheet ก่อน แล้ววาง ID/URL ตอนถูกถาม)
// ==============================================
function importTiktokSalesJK() {
  _importTiktokSales("JK", TIER_SALE_JK_COL);
}

function importTiktokSalesJKKP() {
  _importTiktokSales("JKกพ", TIER_SALE_JKKP_COL);
}

function _importTiktokSales(shopLabel, targetCol) {
  var ui = SpreadsheetApp.getUi();

  var srcRes = ui.prompt(
    "💰 Import ยอดขาย TikTok " + shopLabel,
    "วาง Google Sheet ID หรือ URL ของไฟล์ TikTok ที่เปิดเป็น Google Sheet แล้ว\n" +
    "(ดาวน์โหลด xlsx จาก TikTok → คลิกขวา > Open with > Google Sheets → copy link มาวาง)",
    ui.ButtonSet.OK_CANCEL
  );
  if (srcRes.getSelectedButton() !== ui.Button.OK) return;

  var dstRes = ui.prompt(
    "💰 Import ยอดขาย TikTok " + shopLabel,
    "ชื่อ Sheet ปลายทาง (เดือนที่จะอัปเดต) เช่น Tierlist_Jun",
    ui.ButtonSet.OK_CANCEL
  );
  if (dstRes.getSelectedButton() !== ui.Button.OK) return;

  var srcId   = _extractSheetId(srcRes.getResponseText().trim());
  var dstName = dstRes.getResponseText().trim();

  var srcSS, srcSheet;
  try {
    srcSS    = SpreadsheetApp.openById(srcId);
    srcSheet = srcSS.getSheets()[0]; // ไฟล์ TikTok export มีแค่ 1 sheet เสมอ
  } catch (e) {
    _alert("❌ เปิดไฟล์ไม่ได้ ตรวจสอบ ID/URL อีกครั้ง\n" + e.message);
    return;
  }

  var srcData = srcSheet.getDataRange().getValues();
  var header  = srcData.shift();

  // หา column ด้วยชื่อ header แทนการ hardcode ตำแหน่ง เผื่อ TikTok สลับลำดับ column
  var handleIdx = header.indexOf("ชื่อผู้ใช้ของครีเอเตอร์");
  var gmvIdx    = header.indexOf("GMV จากแอฟฟิลิเอต");

  if (handleIdx === -1 || gmvIdx === -1) {
    _alert("❌ ไม่พบ column 'ชื่อผู้ใช้ของครีเอเตอร์' หรือ 'GMV จากแอฟฟิลิเอต' ในไฟล์นี้\n" +
           "TikTok อาจเปลี่ยนรูปแบบ export — ต้องเช็ค header ใหม่");
    return;
  }

  var gmvMap = {};
  srcData.forEach(function(row) {
    var handle = _normalize(String(row[handleIdx]));
    var gmv    = parseFloat(row[gmvIdx]) || 0;
    if (!handle) return;
    gmvMap[handle] = gmv; // 1 row ต่อ 1 creator อยู่แล้ว ไม่ต้อง sum
  });

  var dst = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(dstName);
  if (!dst) { _alert("❌ ไม่พบ Sheet: " + dstName); return; }

  var lastRow = dst.getLastRow();
  if (lastRow < 2) { _alert("⚠️ ไม่มีข้อมูลใน " + dstName); return; }

  var tiktokCol   = dst.getRange(2, TIER_TIKTOK_COL, lastRow - 1, 1).getValues();
  var existingCol = dst.getRange(2, targetCol,       lastRow - 1, 1).getValues();
  var reviewCol   = dst.getRange(2, TIER_REVIEW_COL, lastRow - 1, 1).getValues();

  var output = [], outputReview = [];
  var matched = 0, partial = 0, conflicts = 0;
  var usedGlobal = {}; // กัน handle เดียวกันถูกเอาไปนับซ้ำให้คนละแถวในรอบเดียวกัน

  for (var i = 0; i < tiktokCol.length; i++) {
    var r = _matchSalesExact(String(tiktokCol[i][0]), gmvMap, usedGlobal);
    var currentReview = String(reviewCol[i][0] || "");

    if (r.totalParts === 0) {
      // Col F ว่าง ไม่มี handle ให้ match เลย
      output.push([existingCol[i][0]]);
      outputReview.push([currentReview]);
      continue;
    }

    if (r.conflict) {
      output.push([existingCol[i][0]]);
      outputReview.push([_setReviewFlag(currentReview, shopLabel,
        "handle ซ้ำกับแถวอื่น ตรวจสอบ")]);
      conflicts++;
      continue;
    }

    if (r.matchedCount === 0) {
      // ไม่ match เลยสักตัว (exact match ล้วน) → เก็บค่าเดิม ไม่ flag (อาจแค่ยังไม่มียอดรอบนี้)
      output.push([existingCol[i][0]]);
      outputReview.push([currentReview]);
      continue;
    }

    if (r.matchedCount < r.totalParts) {
      // match ได้แค่บางช่อง — ไม่ overwrite เก็บค่าเดิมไว้ + flag ให้ตรวจมือ
      output.push([existingCol[i][0]]);
      outputReview.push([_setReviewFlag(currentReview, shopLabel,
        "ยอดไม่ครบ (" + r.matchedCount + "/" + r.totalParts + " ช่อง)")]);
      partial++;
      continue;
    }

    // match ครบทุก handle ในแถวนี้ → เขียนยอดใหม่ และล้าง flag เดิมของ shop นี้ (ถ้ามี)
    output.push([r.total]);
    outputReview.push([_setReviewFlag(currentReview, shopLabel, null)]);
    r.usedKeys.forEach(function(k) { usedGlobal[k] = true; });
    matched++;
  }

  dst.getRange(2, targetCol, output.length, 1).setValues(output);
  dst.getRange(2, TIER_REVIEW_COL, outputReview.length, 1).setValues(outputReview);
  _recalcTotalSale(dst, lastRow);

  var msg = dstName + " (" + shopLabel + "): " + matched + " ครบ, " +
            partial + " ไม่ครบ(flag), " + conflicts + " ชนกัน(flag) / " + tiktokCol.length + " แถว";
  _logToSheet("importTiktokSales", msg);
  _alert("✅ Import เสร็จ!\n\n" + msg + "\n\n📊 อัปเดต Col L (ยอดรวม) ให้แล้วด้วย" +
    (partial + conflicts > 0 ? "\n\n⚠️ มีแถวที่ต้องตรวจมือ ดูที่ Col O" : ""));
}

// Exact match อย่างเดียว (ไม่ fuzzy) — สำหรับยอดขายที่กระทบ Tier/รางวัลตรง ๆ
// คืนค่า: total ที่ match ได้, จำนวน handle ที่ match ได้ vs ทั้งหมดในแถว, และ conflict ถ้า handle ถูกแถวอื่นใช้ไปแล้ว
function _matchSalesExact(tierRaw, gmvMap, usedGlobal) {
  var parts = tierRaw.split(/[\/,]+/)
    .map(_normalize)
    .filter(function(p) { return p; });

  var total = 0, matchedCount = 0, usedKeys = [], conflict = false;

  parts.forEach(function(norm) {
    if (gmvMap[norm] === undefined) return; // ไม่เจอ exact match — ข้าม ไม่เดา

    if (usedGlobal[norm]) {
      conflict = true; // handle นี้ถูกแถวอื่นกินไปแล้วในรอบนี้
      return;
    }

    total += gmvMap[norm];
    matchedCount++;
    usedKeys.push(norm);
  });

  return {
    total: total,
    matchedCount: matchedCount,
    totalParts: parts.length,
    usedKeys: usedKeys,
    conflict: conflict
  };
}

// เขียน/ลบ flag ของ shop หนึ่งใน Col O โดยไม่ไปยุ่งกับ flag ของ shop อื่นที่เขียนไว้ก่อน
// เก็บเป็นหลายบรรทัด แต่ละบรรทัด prefix ด้วย [JK]/[JKกพ] แยกกัน
function _setReviewFlag(currentText, shopLabel, newFlagText) {
  var prefix = "[" + shopLabel + "] ";
  var lines = String(currentText || "").split("\n").filter(function(l) { return l.trim(); });
  var otherLines = lines.filter(function(l) { return l.indexOf(prefix) !== 0; });
  if (newFlagText) otherLines.push(prefix + newFlagText);
  return otherLines.join("\n");
}

// รวม H+I+J ใหม่ลง Col L ให้อัตโนมัติ หลัง import ยอดขาย TikTok เสร็จ
function _recalcTotalSale(sheet, lastRow) {
  var hCol = sheet.getRange(2, TIER_SALE_JK_COL,   lastRow - 1, 1).getValues();
  var iCol = sheet.getRange(2, TIER_SALE_JKKP_COL, lastRow - 1, 1).getValues();
  var jCol = sheet.getRange(2, TIER_SHOPEE_COL,    lastRow - 1, 1).getValues();

  var totals = [];
  for (var i = 0; i < hCol.length; i++) {
    var h = parseFloat(hCol[i][0]) || 0;
    var iv = parseFloat(iCol[i][0]) || 0;
    var j = parseFloat(jCol[i][0]) || 0;
    totals.push([h + iv + j]);
  }
  sheet.getRange(2, TIER_SALES_COL, totals.length, 1).setValues(totals);
}

// ดึง Sheet ID จาก URL เต็มๆ หรือใช้ตรงๆถ้าวาง ID มาแล้ว
function _extractSheetId(input) {
  var m = input.match(/[-\w]{25,}/);
  return m ? m[0] : input;
}


// ==============================================
//  นับคลิป — ดึงจาก 4 ฟอร์ม → match → เขียน Col M
// ==============================================
function updateAllMonths() {
  var monthly = readAndMergeAll_();
  var summary = [];

  for (var month in monthly) {
    var sheetName = MONTH_SHEETS[month];
    if (!sheetName) continue;
    var r = writeToSheet_(sheetName, monthly[month]);
    if (r) summary.push(sheetName + ": " + r.matched + " matched");
  }

  _logToSheet("updateAllMonths", summary.join(", "));
  _alert("✅ อัปเดตครบ!\n\n" + summary.join("\n"));
}

function updateCurrentMonth() {
  var month     = new Date().getMonth() + 1;
  var sheetName = MONTH_SHEETS[month];
  if (!sheetName) return;

  var monthly = readAndMergeAll_();
  var clipMap = monthly[month] || {};

  var r   = writeToSheet_(sheetName, clipMap);
  var msg = sheetName + ": " + (r ? r.matched : 0) + " matched";
  _logToSheet("updateCurrentMonth", msg);
  _alert("✅ " + msg);
}

function readAndMergeAll_() {
  var result = {};

  FORM_SOURCES.forEach(function(src) {
    try {
      var ss    = SpreadsheetApp.openById(src.id);
      var sheet = ss.getSheetByName(src.tab);
      if (!sheet) { _logToSheet("read", "SKIP " + src.name + ": tab not found"); return; }

      var data = sheet.getDataRange().getValues();
      data.shift(); // remove header
      var count = 0;

      data.forEach(function(row) {
        var ts     = row[src.timeCol - 1];
        var tiktok = _normalize(String(row[src.tiktokCol - 1]));
        var clips  = parseFloat(row[src.clipsCol - 1]) || 0;
        if (!tiktok || clips === 0) return;

        var month = parseMonth_(ts);
        if (!month) return;

        if (!result[month]) result[month] = {};
        if (!result[month][tiktok]) result[month][tiktok] = 0;
        result[month][tiktok] += clips;
        count++;
      });

      _logToSheet("read", src.name + ": " + count + " rows with clips");
    } catch (e) {
      _logToSheet("read", "ERROR " + src.name + ": " + e.message);
    }
  });

  return result;
}

// 🔧 FIX (bug #1): ไม่ match รอบนี้ → เก็บค่าเดิมไว้ ไม่เขียนทับเป็น "" (กันคลิปที่เคย sync ไว้ถูกลบ)
function writeToSheet_(sheetName, clipMap) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return null;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { matched: 0 };

  var tiktokCol     = sheet.getRange(2, TIER_TIKTOK_COL, lastRow - 1, 1).getValues();
  var existingClips = sheet.getRange(2, TIER_CLIPS_COL,  lastRow - 1, 1).getValues();

  var output = [], matched = 0;
  for (var i = 0; i < tiktokCol.length; i++) {
    var total = findMatch_(String(tiktokCol[i][0]), clipMap);
    if (total > 0) {
      output.push([total]);
      matched++;
    } else {
      output.push([existingClips[i][0]]); // เก็บค่าเดิม
    }
  }

  sheet.getRange(2, TIER_CLIPS_COL, output.length, 1).setValues(output);
  return { matched: matched };
}

// 🔧 FIX (bug #2): fuzzy match เลือกแค่ตัวที่ตรงที่สุด (ยาวที่สุด) ตัวเดียว ไม่รวมทุกตัวที่ match
// (กันไม่ให้รวมคลิปของคนอื่นที่ handle บังเอิญเป็น substring เข้ามาด้วย)
function findMatch_(tierRaw, clipMap) {
  var parts = tierRaw.split(/[\/,]+/);
  var total = 0, used = {};

  parts.forEach(function(part) {
    var norm = _normalize(part);
    if (!norm) return;

    if (clipMap[norm] !== undefined && !used[norm]) {
      total += clipMap[norm];
      used[norm] = true;
      return;
    }

    var bestKey = null;
    Object.keys(clipMap).forEach(function(key) {
      if (used[key] || key.length <= 3 || norm.length <= 3) return;
      if (key.indexOf(norm) !== -1 || norm.indexOf(key) !== -1) {
        if (!bestKey || key.length > bestKey.length) bestKey = key;
      }
    });
    if (bestKey) {
      total += clipMap[bestKey];
      used[bestKey] = true;
    }
  });
  return total;
}

// 🔧 FIX (bug #3): แยกแยะวัน/เดือนเมื่อทำได้ (ถ้าค่าใดเกิน 12 ต้องเป็น "วัน" แน่ๆ)
// ใช้ค่า default DD/MM/YYYY เฉพาะกรณีกำกวมจริง (ทั้งคู่ ≤12)
function parseMonth_(ts) {
  if (ts instanceof Date) return ts.getMonth() + 1;

  var str = String(ts).trim();
  var m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;

  var a = parseInt(m[1], 10);
  var b = parseInt(m[2], 10);

  if (a > 12 && b <= 12) return b;
  if (b > 12 && a <= 12) return a;

  return b; // กำกวม → default DD/MM/YYYY
}


// ==============================================
//  TRIGGER — auto นับคลิปทุก 1 ชม. (Tier update ไม่ใช้ trigger เพราะอัปเดตมือทุกต้นเดือน)
// ==============================================
function setupTrigger() {
  removeTrigger();
  ScriptApp.newTrigger("updateCurrentMonth")
    .timeBased().everyHours(1).create();
  _logToSheet("trigger", "เปิด auto นับคลิป ทุก 1 ชม.");
  _alert("⏰ Auto trigger เปิดแล้ว!\nรันทุก 1 ชม. — ปิดได้ที่เมนู Clip Sync");
}

function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "updateCurrentMonth" ||
        t.getHandlerFunction() === "updateAllMonths") {
      ScriptApp.deleteTrigger(t);
    }
  });
  _logToSheet("trigger", "ปิด auto นับคลิปแล้ว");
}


// ==============================================
//  MARK DUPLICATES — สแกนหา row ซ้ำ → mark Col N
// ==============================================
function markDuplicatesAllSheets() {
  var total = 0;
  Object.keys(MONTH_SHEETS).forEach(function(m) {
    var name = MONTH_SHEETS[m];
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    if (ss.getSheetByName(name)) {
      total += _markDuplicatesInSheet(name);
    }
  });
  _logToSheet("markDuplicates", "all sheets | marked: " + total);
  _alert("✅ สแกนเสร็จ!\n🔖 marked ซ้ำ: " + total + " rows\n\nดูได้ที่ Col N ของทุก Tierlist");
}

function markDuplicatesCurrentSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var name  = sheet.getName();

  if (name.indexOf("Tierlist_") !== 0) {
    _alert("⚠️ กรุณาเปิด Sheet ที่ชื่อขึ้นต้นด้วย Tierlist_ ก่อนรัน");
    return;
  }

  var count = _markDuplicatesInSheet(name);
  _logToSheet("markDuplicates", name + " | marked: " + count);
  _alert("✅ สแกน " + name + " เสร็จ!\n🔖 marked ซ้ำ: " + count + " rows");
}

function _markDuplicatesInSheet(sheetName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  var numCols = TIER_NOTE_COL;
  var data    = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

  var seenPhone  = {};
  var seenTiktok = {};

  data.forEach(function(row, i) {
    var phone  = _normalizePhone(String(row[TIER_PHONE_COL - 1]));
    var tiktok = _normalize(String(row[TIER_TIKTOK_COL - 1]));

    if (phone  && seenPhone[phone]   === undefined) seenPhone[phone]   = i;
    if (tiktok && seenTiktok[tiktok] === undefined) seenTiktok[tiktok] = i;
  });

  var marked = 0;

  data.forEach(function(row, i) {
    var phone       = _normalizePhone(String(row[TIER_PHONE_COL - 1]));
    var tiktok      = _normalize(String(row[TIER_TIKTOK_COL - 1]));
    var currentNote = String(row[TIER_NOTE_COL - 1]).trim();

    var isDuplicate =
      (phone  && seenPhone[phone]   !== i) ||
      (tiktok && seenTiktok[tiktok] !== i);

    if (isDuplicate) {
      if (currentNote !== TIER_NOTE_DUPL) {
        sheet.getRange(i + 2, TIER_NOTE_COL).setValue(TIER_NOTE_DUPL);
        marked++;
      }
    } else {
      if (currentNote === TIER_NOTE_DUPL) {
        sheet.getRange(i + 2, TIER_NOTE_COL).setValue("");
      }
    }
  });

  return marked;
}


// ==============================================
//  HELPERS (รวมเป็นชุดเดียว)
// ==============================================
function _normalize(str) {
  return String(str).trim().toLowerCase()
    .replace(/^@/, "")
    .replace(/\s+/g, "")
    .replace(/^www\.tiktok\.com\/@?/, "");
}

function _normalizePhone(str) {
  var digits = String(str).replace(/\D/g, "");
  if (!digits || digits === "0") return "";
  return digits;
}

function _logToSheet(fn, msg) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("_sync_log");
    if (!sheet) {
      sheet = ss.insertSheet("_sync_log");
      sheet.appendRow(["Timestamp", "Function", "Message"]);
    }
    sheet.appendRow([new Date(), fn, msg]);
  } catch (e) {}
}

function _alert(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
}
