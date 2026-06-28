/**
 * Client-side utility for exporting structured data into downloadable Excel (.xls) or CSV files.
 */
export function downloadExcel(filename: string, headers: string[], rows: any[][]) {
  let content = '<tr>' + headers.map(h => `<th style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${h}</th>`).join('') + '</tr>';
  
  rows.forEach(row => {
    content += 'tr' + row.map(cell => {
      const val = cell === undefined || cell === null ? '' : String(cell);
      const isNum = !isNaN(Number(val)) && val !== '';
      return `<td style="border: 1px solid #cbd5e1; padding: 6px; text-align: ${isNum ? 'right' : 'left'};">${val}</td>`;
    }).join('') + '</tr>';
  });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>SKP_Sheet</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    </head>
    <body>
      <table>
        ${content}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
