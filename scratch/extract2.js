const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {};
pdfExtract.extract('E:\\Dev\\Unity Text Styles\\Unity Editor UI Toolkit Library (Community).pdf', options, (err, data) => {
  if (err) return console.log(err);
  let allText = '';
  data.pages.forEach(page => {
    page.content.forEach(item => {
      allText += item.str + '\n';
    });
  });
  require('fs').writeFileSync('E:\\Dev\\blog\\scratch\\pdf_text.txt', allText);
  console.log('done');
});
