package com.corebank.service;

import com.corebank.dto.Responses;
import com.corebank.entity.User;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class StatementService {

    private static final Color NAVY = new Color(10, 24, 48);
    private static final Color MUTED = new Color(92, 107, 130);
    private static final Color LINE = new Color(228, 233, 242);
    private static final Color ZEBRAS = new Color(247, 249, 252);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final TransactionService transactionService;

    public StatementService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public byte[] pdf(User user, Long accountId, java.time.LocalDate from, java.time.LocalDate to) {
        Responses.StatementView view = transactionService.statement(user, accountId, from, to);
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 36, 36, 42, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            Font brand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, NAVY);
            Font small = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);
            Font label = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, NAVY);
            Font body = FontFactory.getFont(FontFactory.HELVETICA, 9, NAVY);
            Font header = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
            Font money = FontFactory.getFont(FontFactory.HELVETICA, 9, NAVY);

            document.add(new Paragraph("CoreBank", brand));
            document.add(new Paragraph("Account statement", FontFactory.getFont(FontFactory.HELVETICA, 11, MUTED)));
            document.add(new Paragraph(" ", small));

            PdfPTable meta = new PdfPTable(2);
            meta.setWidthPercentage(100);
            meta.setWidths(new float[]{1.2f, 2f});
            meta.addCell(metaCell("Account holder", user.getFullName(), label, body));
            meta.addCell(metaCell("Account number", view.account().accountNumber(), label, body));
            meta.addCell(metaCell("Account type", pretty(view.account().accountType()), label, body));
            meta.addCell(metaCell("IFSC / Branch", view.account().ifsc() + " · " + view.account().branch(), label, body));
            meta.addCell(metaCell("Period", view.from().format(DAY) + "  –  " + view.to().format(DAY), label, body));
            meta.addCell(metaCell("Currency", "INR", label, body));
            document.add(meta);
            document.add(new Paragraph(" ", small));

            PdfPTable totals = new PdfPTable(4);
            totals.setWidthPercentage(100);
            totals.addCell(totalCell("Opening", inr(view.openingBalance()), label, body));
            totals.addCell(totalCell("Money in", inr(view.totalCredit()), label, body));
            totals.addCell(totalCell("Money out", inr(view.totalDebit()), label, body));
            totals.addCell(totalCell("Closing", inr(view.closingBalance()), label, body));
            document.add(totals);
            document.add(new Paragraph(" ", small));

            PdfPTable table = new PdfPTable(new float[]{2.3f, 3.6f, 1.5f, 1.5f, 1.7f});
            table.setWidthPercentage(100);
            for (String heading : new String[]{"Date", "Description", "Debit", "Credit", "Balance"}) {
                PdfPCell cell = new PdfPCell(new Phrase(heading, header));
                cell.setBackgroundColor(NAVY);
                cell.setPadding(7);
                cell.setBorder(Rectangle.NO_BORDER);
                table.addCell(cell);
            }

            int row = 0;
            for (Responses.TransactionView txn : view.transactions()) {
                Color bg = row++ % 2 == 0 ? Color.WHITE : ZEBRAS;
                boolean credit = "CREDIT".equals(txn.direction());
                table.addCell(bodyCell(txn.createdAt().format(DATE), body, bg, Element.ALIGN_LEFT));
                String detail = txn.description();
                if (txn.referenceNumber() != null) {
                    detail = detail + "\n" + txn.referenceNumber();
                }
                table.addCell(bodyCell(detail, body, bg, Element.ALIGN_LEFT));
                table.addCell(bodyCell(credit ? "" : inr(txn.amount()), money, bg, Element.ALIGN_RIGHT));
                table.addCell(bodyCell(credit ? inr(txn.amount()) : "", money, bg, Element.ALIGN_RIGHT));
                table.addCell(bodyCell(inr(txn.balanceAfter()), money, bg, Element.ALIGN_RIGHT));
            }
            if (view.transactions().isEmpty()) {
                PdfPCell empty = new PdfPCell(new Phrase("No transactions in this period.", body));
                empty.setColspan(5);
                empty.setPadding(12);
                empty.setBorderColor(LINE);
                table.addCell(empty);
            }
            document.add(table);
            document.add(new Paragraph(" ", small));
            document.add(new Paragraph(
                    "This is a computer-generated statement from CoreBank for academic demonstration. It does not require a signature.",
                    small));
            document.close();
            return out.toByteArray();
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Could not build the statement PDF", ex);
        }
    }

    private PdfPCell metaCell(String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(LINE);
        cell.setPadding(6);
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value == null ? "—" : value, valueFont));
        return cell;
    }

    private PdfPCell totalCell(String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(LINE);
        cell.setPadding(8);
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value, valueFont));
        return cell;
    }

    private PdfPCell bodyCell(String text, Font font, Color background, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text, font));
        cell.setBackgroundColor(background);
        cell.setPadding(6);
        cell.setHorizontalAlignment(align);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(LINE);
        return cell;
    }

    private String pretty(String type) {
        return "SAVINGS".equals(type) ? "Savings" : "Current";
    }

    private String inr(java.math.BigDecimal amount) {
        return java.text.NumberFormat.getCurrencyInstance(new Locale("en", "IN")).format(amount);
    }
}
