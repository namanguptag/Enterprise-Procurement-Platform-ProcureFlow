const PDFDocument = require('pdfkit');

class PdfGenerator {
  /**
   * Generate a professional purchase order invoice PDF and stream it to the client.
   */
  generatePurchaseOrderPdf(res, order) {
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to HTTP response
    doc.pipe(res);

    // 1. Header & Company Branding
    doc.fillColor('#1E293B')
       .fontSize(20)
       .text('ProcureFlow Enterprise', 50, 45, { bold: true });
    
    doc.fontSize(10)
       .fillColor('#64748B')
       .text('Operational Procurement Division', 50, 70);

    // Document Type Label (Right aligned)
    doc.fillColor('#2563EB')
       .fontSize(16)
       .text('PURCHASE ORDER', 400, 45, { align: 'right', bold: true });

    doc.fillColor('#64748B')
       .fontSize(10)
       .text(`PO Number: ${order.po_number}`, 400, 65, { align: 'right' })
       .text(`Date Generated: ${new Date(order.created_at).toLocaleDateString()}`, 400, 80, { align: 'right' });

    // Decorative line
    doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#E5E7EB').stroke();

    // 2. Vendor and Order Info
    doc.fillColor('#1E293B')
       .fontSize(11)
       .text('VENDOR DETAILS', 50, 115, { bold: true })
       .fontSize(10)
       .fillColor('#334155')
       .text(`Name: ${order.vendor_name}`, 50, 135)
       .text(`Email: ${order.vendor_email}`, 50, 150)
       .text(`Phone: ${order.vendor_phone}`, 50, 165);

    doc.fillColor('#1E293B')
       .fontSize(11)
       .text('DELIVERY DETAILS', 300, 115, { bold: true })
       .fontSize(10)
       .fillColor('#334155')
       .text(`Expected Date: ${order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}`, 300, 135)
       .text(`Creator: ${order.creator_name}`, 300, 150)
       .text(`Status: ${order.status.toUpperCase()}`, 300, 165);

    // Decorative line
    doc.moveTo(50, 190).lineTo(550, 190).strokeColor('#E5E7EB').stroke();

    // 3. Table Header
    let y = 205;
    doc.fillColor('#1E293B')
       .fontSize(10)
       .text('Product Name / SKU', 50, y, { bold: true })
       .text('Quantity', 280, y, { bold: true, align: 'right', width: 60 })
       .text('Unit Price', 360, y, { bold: true, align: 'right', width: 80 })
       .text('Total', 460, y, { bold: true, align: 'right', width: 90 });

    doc.moveTo(50, 220).lineTo(550, 220).strokeColor('#1E293B').stroke();

    // 4. Table Items
    y = 230;
    order.items.forEach((item) => {
      // Ensure page wrap protection
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fillColor('#334155')
         .text(`${item.product_name}\n(SKU: ${item.sku})`, 50, y, { width: 220 })
         .text(item.quantity.toString(), 280, y, { align: 'right', width: 60 })
         .text(`INR ${parseFloat(item.unit_price).toFixed(2)}`, 360, y, { align: 'right', width: 80 })
         .text(`INR ${parseFloat(item.total_item_price).toFixed(2)}`, 460, y, { align: 'right', width: 90 });

      y += 35; // Increment spacing (accounting for SKU subtitle)
    });

    // Decorative line before total
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#E5E7EB').stroke();
    y += 10;

    // 5. Grand Total Block
    doc.fillColor('#1E293B')
       .fontSize(12)
       .text(`GRAND TOTAL:`, 300, y, { bold: true, align: 'right', width: 140 })
       .text(`INR ${parseFloat(order.total_amount).toFixed(2)}`, 460, y, { bold: true, align: 'right', width: 90 });

    // Footer
    doc.fontSize(8)
       .fillColor('#94A3B8')
       .text('Thank you for choosing ProcureFlow. This is an automatically generated system document.', 50, 740, { align: 'center' });

    doc.end();
  }
}

module.exports = new PdfGenerator();
