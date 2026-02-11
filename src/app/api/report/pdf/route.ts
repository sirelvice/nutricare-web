import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

// If you ever run into caching issues in dev:
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Collect chunks properly (wait for end)
  const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ---- PDF CONTENT ----
    doc.fontSize(20).text("NutriCare Impact Snapshot", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).fillColor("#334155").text("Generated for program reporting and donor review.");
    doc.moveDown(1.5);

    doc.fillColor("#0f172a").fontSize(14).text("Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor("#0f172a").text("- People reached: 1,245");
    doc.text("- Facilities: 18");
    doc.text("- Screenings completed: 3,420");
    doc.text("- Reports exported: 62");

    doc.moveDown(1.2);
    doc.fontSize(14).fillColor("#0f172a").text("Safeguards", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor("#0f172a").text("- Privacy-first data handling");
    doc.text("- No individual health data shared");
    doc.text("- Aggregated metrics only");

    doc.moveDown(1.5);
    doc.fontSize(10).fillColor("#64748b").text(
      "Note: This is a demo snapshot. Next we will generate this report from real saved profile + tracking data.",
      { align: "left" }
    );

    doc.end();
  });

  // Return PDF as downloadable attachment
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="nutricare-impact-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
