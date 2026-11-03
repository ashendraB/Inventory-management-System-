"use client";

import JsBarcode from "jsbarcode";
import { PDFDocument, degrees } from "pdf-lib";

// Size and placement of the barcode on page 1, in PDF points (1 pt = 1/72 in).
const BARCODE_WIDTH_PT = 120;
const MARGIN_PT = 8;

/** Renders `value` as a Code 128 barcode (with the text under it) to PNG bytes. */
function barcodePng(value: string): { bytes: Uint8Array; aspect: number } {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 22,
    height: 70,
    width: 4, // pixels per bar module — high enough to stay sharp when printed
    margin: 14,
    background: "#ffffff", // opaque white so it stays readable over page content
    lineColor: "#000000",
  });
  const base64 = canvas.toDataURL("image/png").split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, aspect: canvas.height / canvas.width };
}

/** Returns a copy of the PDF with a barcode for `value` in the bottom-right
 * corner of page 1, as the reader sees it (page rotation and crop box are
 * respected). The input bytes are never modified. */
export async function stampBarcode(pdfBytes: ArrayBuffer, value: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const page = pdf.getPage(0);
  const png = await pdf.embedPng(barcodePng(value).bytes);

  const w = BARCODE_WIDTH_PT;
  const h = w * (png.height / png.width);

  // The visible area: the crop box (defaults to the media box).
  const box = page.getCropBox();
  const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
  const visualW = rotation === 90 || rotation === 270 ? box.height : box.width;

  // Bottom-left corner of the barcode in the *visual* (as displayed) frame,
  // measured from the visible page's bottom-left.
  const vx = visualW - MARGIN_PT - w;
  const vy = MARGIN_PT;

  // Map that corner into the page's own (unrotated) coordinate space, and
  // rotate the image so it reads upright on the displayed page.
  let x: number;
  let y: number;
  switch (rotation) {
    case 90:
      x = box.width - vy;
      y = vx;
      break;
    case 180:
      x = box.width - vx;
      y = box.height - vy;
      break;
    case 270:
      x = vy;
      y = box.height - vx;
      break;
    default:
      x = vx;
      y = vy;
  }

  page.drawImage(png, {
    x: box.x + x,
    y: box.y + y,
    width: w,
    height: h,
    rotate: degrees(rotation),
  });

  return pdf.save();
}
