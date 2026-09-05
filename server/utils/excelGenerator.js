const ExcelJS = require('exceljs');

class ExcelGenerator {
  /**
   * Export an Excel sheet representing the Current Inventory.
   */
  async generateInventoryExcel(res, inventoryList) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');

    // Title Row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ProcureFlow - Enterprise Inventory Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // Subtitle Info Row
    worksheet.mergeCells('A2:G2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Generated on: ${new Date().toLocaleString()} | Confidential Business Data`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };
    subtitleCell.alignment = { horizontal: 'left' };
    worksheet.getRow(2).height = 20;

    // Space row
    worksheet.addRow([]);

    // Table Column Definitions
    worksheet.getRow(4).values = [
      'Product ID',
      'Product Name',
      'SKU Code',
      'Category',
      'Current Stock',
      'Incoming (On PO)',
      'Outgoing (Allocated)'
    ];

    // Style Headers
    const headerRow = worksheet.getRow(4);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // Populate data
    inventoryList.forEach((item) => {
      worksheet.addRow([
        item.product_id,
        item.product_name,
        item.sku,
        item.category_name,
        parseInt(item.current_stock, 10),
        parseInt(item.incoming_stock, 10),
        parseInt(item.outgoing_stock, 10)
      ]);
    });

    // Format numbers & align data cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E2E8F0' } },
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } }
          };

          // Alignment
          if (colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 7) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      }
    });

    // Auto-fit Column Widths
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? cell.value.toString() : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    // Set Response Headers and Pipe Workbook
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ProcureFlow_Inventory_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export an Excel sheet representing the Vendors list.
   */
  async generateVendorExcel(res, vendorList) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vendor Directory');

    // Title Row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ProcureFlow - Enterprise Vendor Directory';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // Subtitle Info Row
    worksheet.mergeCells('A2:G2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Generated on: ${new Date().toLocaleString()} | Verified Partners list`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };
    subtitleCell.alignment = { horizontal: 'left' };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]); // Blank spacer

    // Column Headers
    worksheet.getRow(4).values = [
      'Vendor ID',
      'Vendor Name',
      'Company Name',
      'GSTIN Number',
      'Contact Email',
      'Phone Number',
      'Status'
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // Populate data
    vendorList.forEach((vendor) => {
      worksheet.addRow([
        vendor.id,
        vendor.name,
        vendor.company,
        vendor.gst_number,
        vendor.email,
        vendor.phone || 'N/A',
        vendor.status.toUpperCase()
      ]);
    });

    // Format columns and borders
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E2E8F0' } },
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } }
          };

          if (colNumber === 1) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      }
    });

    // Auto-fit Column Widths
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? cell.value.toString() : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ProcureFlow_Vendors_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }
}

module.exports = new ExcelGenerator();
