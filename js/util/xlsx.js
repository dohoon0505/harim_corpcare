/* ============================================================
   xlsx.js — 의존성 없는 최소 XLSX 생성기 (store-only ZIP + inline strings).
   aoaToXlsx(sheetName, rows) → Uint8Array (진짜 .xlsx 바이트).
   rows: 2차원 배열. 각 셀은 string | number (number → 숫자셀, 엑셀에서 합계 가능).
   외부 라이브러리 없이 OOXML 패키지(zip)를 직접 조립한다. TextEncoder만 사용(브라우저·Node 공통).
   ============================================================ */

/* CRC-32 (ZIP 무결성) */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const enc = (s) => new TextEncoder().encode(s);
const xesc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* 0-based 열 인덱스 → A, B, …, Z, AA … */
function colRef(n) {
  let s = "";
  n += 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function sheetXml(rows) {
  const body = rows
    .map((row, r) => {
      const cells = (row || [])
        .map((val, c) => {
          const ref = colRef(c) + (r + 1);
          if (typeof val === "number" && isFinite(val)) return `<c r="${ref}"><v>${val}</v></c>`;
          const text = val == null ? "" : String(val);
          if (text === "") return `<c r="${ref}"/>`;
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(text)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

function concat(arrays) {
  let len = 0;
  for (const a of arrays) len += a.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrays) { out.set(a, o); o += a.length; }
  return out;
}
const u16 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
const u32 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);

/* store(무압축) 방식 ZIP 조립 → Uint8Array */
function zipStore(files) {
  const out = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameBytes = enc(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;
    const lfh = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), nameBytes,
    ]);
    out.push(lfh, f.data);
    central.push(
      concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(nameBytes.length),
        u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
      ])
    );
    offset += lfh.length + size;
  }
  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) { out.push(c); cdSize += c.length; }
  out.push(
    concat([
      u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(cdSize), u32(cdStart), u16(0),
    ])
  );
  return concat(out);
}

/* 2차원 배열 → .xlsx 바이트 (단일 시트) */
export function aoaToXlsx(sheetName, rows) {
  const name = xesc(String(sheetName || "Sheet1").replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
  const parts = [
    { name: "[Content_Types].xml", data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`) },
    { name: "_rels/.rels", data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
    { name: "xl/workbook.xml", data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
    { name: "xl/_rels/workbook.xml.rels", data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`) },
    { name: "xl/worksheets/sheet1.xml", data: enc(sheetXml(rows)) },
  ];
  return zipStore(parts);
}
