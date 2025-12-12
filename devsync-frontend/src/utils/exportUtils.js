export const exportAsCSV = (history, monitorName) => {
  if (!history || history.length === 0) {
    alert("No data to export!");
    return;
  }

  // CSV Headers.
  const headers = [
    "Time",
    "Status",
    "Response Time (ms)",
    "Status Code",
    "Error",
  ];

  // CSV Rows
  const rows = history.map((check) => [
    new Date(check.checkedAt).toLocaleString(),
    check.ok ? "UP" : "DOWN",
    check.responseTimeMs || "N/A",
    check.statusCode || "N/A",
    check.error || "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${monitorName}-history-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export history data as PDF (requires jsPDF library)
 * Install: npm install jspdf
 */
export const exportAsPDF = async (history, monitorName, monitorUrl) => {
  try {
    // Dynamically import jsPDF to avoid bundle size issues
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(`Monitor: ${monitorName}`, 14, 22);

    // URL
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`URL: ${monitorUrl}`, 14, 32);

    // Date
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

    // Table data
    const tableData = history.map((check) => [
      new Date(check.checkedAt).toLocaleString(),
      check.ok ? "UP" : "DOWN",
      check.responseTimeMs ? `${check.responseTimeMs}ms` : "N/A",
      check.statusCode || "N/A",
    ]);

    // Add table
    doc.autoTable({
      startY: 50,
      head: [["Time", "Status", "Response Time", "Status Code"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 244, 249],
      },
    });

    // Save PDF
    doc.save(
      `${monitorName}-history-${new Date().toISOString().split("T")[0]}.pdf`
    );
  } catch (err) {
    console.error("PDF export failed:", err);
    alert("PDF export requires jsPDF library. Install with: npm install jspdf");
  }
};

/**
 * Export as JSON (most reliable)
 */
export const exportAsJSON = (history, monitorName) => {
  if (!history || history.length === 0) {
    alert("No data to export!");
    return;
  }

  const data = {
    monitor: monitorName,
    exportDate: new Date().toISOString(),
    totalChecks: history.length,
    successCount: history.filter((h) => h.ok).length,
    failureCount: history.filter((h) => !h.ok).length,
    data: history,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${monitorName}-history-${new Date().toISOString().split("T")[0]}.json`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a detailed HTML report
 */
export const exportAsHTML = (history, monitorName, monitorUrl) => {
  if (!history || history.length === 0) {
    alert("No data to export!");
    return;
  }

  const uptime = history.filter((h) => h.ok).length;
  const downtime = history.filter((h) => !h.ok).length;
  const upPercent = ((uptime / history.length) * 100).toFixed(2);

  const tableRows = history
    .map(
      (check) => `
    <tr>
      <td>${new Date(check.checkedAt).toLocaleString()}</td>
      <td><span style="color: ${check.ok ? "green" : "red"}">${
        check.ok ? "UP" : "DOWN"
      }</span></td>
      <td>${check.responseTimeMs ? `${check.responseTimeMs}ms` : "N/A"}</td>
      <td>${check.statusCode || "N/A"}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${monitorName} - Monitor Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1a202c;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        .info {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #3b82f6;
        }
        .stat-label {
          color: #6b7280;
          font-size: 14px;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #3b82f6;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .footer {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Monitor Report: ${monitorName}</h1>
        
        <div class="info">
          <strong>URL:</strong> ${monitorUrl}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Period:</strong> Last 24 Hours
        </div>

        <h2>📈 Statistics</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value" style="color: #10b981">${uptime}</div>
            <div class="stat-label">Successful Checks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ef4444">${downtime}</div>
            <div class="stat-label">Failed Checks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #3b82f6">${upPercent}%</div>
            <div class="stat-label">Uptime</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${history.length}</div>
            <div class="stat-label">Total Checks</div>
          </div>
        </div>

        <h2>📋 Check History</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Status</th>
              <th>Response Time</th>
              <th>Status Code</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by DevSync - Uptime Monitoring System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${monitorName}-report-${new Date().toISOString().split("T")[0]}.html`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
