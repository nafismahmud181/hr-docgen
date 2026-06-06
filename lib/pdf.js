import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCompany, getSignatureImage, getTemplate } from "./db";
import { buildDocument, formatDate } from "./templates";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "PAD_Template.pdf");

// Layout constants (A4: 595 x 842 pt, origin at bottom-left)
const MARGIN_X = 70;
const CONTENT_TOP = 700; // safely below the letterhead header
const CONTENT_BOTTOM = 80;
const BODY_SIZE = 11;
const LINE_HEIGHT = 17;
const PARA_GAP = 12;
const INK = rgb(0.09, 0.12, 0.18); // matches the letterhead navy

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generatePdf(typeKey, employee, options = {}) {
  const company = getCompany();
  const template = options.template || getTemplate(typeKey);
  const base = buildDocument(typeKey, employee, { ...options, company, template });
  // A one-off override (from the live preview editor) replaces the wording for
  // this single document only — the template in lib/templates.js is untouched.
  const doc = options.override
    ? {
        ...base,
        title: options.override.title ?? base.title,
        addressee: options.override.addressee ?? base.addressee,
        closing: options.override.closing ?? base.closing,
        paragraphs: Array.isArray(options.override.paragraphs)
          ? options.override.paragraphs.filter((p) => p && p.trim())
          : base.paragraphs,
      }
    : base;
  const issueDate = formatDate(options.issueDate || new Date().toISOString());

  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.getPage(0);
  const { width } = page.getSize();
  const maxWidth = width - MARGIN_X * 2;
  let y = CONTENT_TOP;

  const newPage = async () => {
    // Re-load the template so continuation pages also carry the letterhead
    const fresh = await PDFDocument.load(templateBytes);
    const [copied] = await pdfDoc.copyPages(fresh, [0]);
    page = pdfDoc.addPage(copied);
    y = CONTENT_TOP;
  };

  const ensureSpace = async (needed) => {
    if (y - needed < CONTENT_BOTTOM) await newPage();
  };

  const drawLine = (text, font, size, opts = {}) => {
    page.drawText(text, {
      x: opts.x ?? MARGIN_X,
      y,
      size,
      font,
      color: INK,
    });
  };

  // ── Date row ──
  const dateText = `Date: ${issueDate}`;
  page.drawText(dateText, {
    x: width - MARGIN_X - regular.widthOfTextAtSize(dateText, 10),
    y,
    size: 10,
    font: regular,
    color: INK,
  });
  y -= 48;

  // ── Title (centered, underlined) ──
  const titleSize = 13;
  const titleWidth = bold.widthOfTextAtSize(doc.title, titleSize);
  const titleX = (width - titleWidth) / 2;
  page.drawText(doc.title, { x: titleX, y, size: titleSize, font: bold, color: INK });
  page.drawLine({
    start: { x: titleX, y: y - 4 },
    end: { x: titleX + titleWidth, y: y - 4 },
    thickness: 0.8,
    color: INK,
  });
  y -= 40;

  // ── Addressee ──
  if (doc.addressee) {
    drawLine(doc.addressee, bold, BODY_SIZE);
    y -= LINE_HEIGHT + PARA_GAP;
  }

  // ── Body paragraphs ──
  for (const para of doc.paragraphs) {
    const lines = wrapText(para, regular, BODY_SIZE, maxWidth);
    await ensureSpace(lines.length * LINE_HEIGHT);
    for (const line of lines) {
      drawLine(line, regular, BODY_SIZE);
      y -= LINE_HEIGHT;
    }
    y -= PARA_GAP;
  }

  // ── Signature block ──
  await ensureSpace(290);
  y -= 24;
  drawLine(doc.closing, regular, BODY_SIZE);

  // Digital signature image, drawn directly under the closing line.
  const sig = getSignatureImage();
  if (sig) {
    const img =
      sig.mime === "image/png" ? await pdfDoc.embedPng(sig.bytes) : await pdfDoc.embedJpg(sig.bytes);
    const maxW = Math.min(510, maxWidth); // capped to stay inside the page margins
    const maxH = 165;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    y -= 10; // small gap below "Sincerely,"
    const sigX = MARGIN_X - 40; // nudge a little left of the text margin
    page.drawImage(img, { x: sigX, y: y - h, width: w, height: h });
    y -= h + 6;
  } else {
    y -= 56; // blank space for a handwritten signature
  }

  page.drawLine({
    start: { x: MARGIN_X, y: y + 12 },
    end: { x: MARGIN_X + 170, y: y + 12 },
    thickness: 0.8,
    color: INK,
  });
  drawLine(company.signatory.name, bold, BODY_SIZE);
  y -= LINE_HEIGHT;
  drawLine(company.signatory.title, regular, 10);
  y -= LINE_HEIGHT - 3;
  drawLine(company.name, regular, 10);
  if (company.email) {
    y -= LINE_HEIGHT - 3;
    drawLine(company.email, regular, 10);
  }
  if (company.website) {
    y -= LINE_HEIGHT - 3;
    drawLine(company.website, regular, 10);
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
