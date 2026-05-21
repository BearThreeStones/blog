const fs = require('fs');
const PDFParser = require('pdf2json');
const pdfParser = new PDFParser(this, 1); // 1 = text mode
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync('E:\\Dev\\blog\\scratch\\pdf_text.txt', pdfParser.getRawTextContent());
    console.log('done');
});
pdfParser.loadPDF('E:\\Dev\\Unity Text Styles\\Unity Editor UI Toolkit Library (Community).pdf');
