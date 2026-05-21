const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const pdfPath = 'E:\\Dev\\Unity Text Styles\\Unity Editor UI Toolkit Library (Community).pdf';

async function extract() {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({data: data}).promise;
    let allText = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        allText += content.items.map(item => item.str).join(' ') + '\n';
    }
    fs.writeFileSync('E:\\Dev\\blog\\scratch\\pdf_text.txt', allText);
    console.log('done');
}
extract().catch(console.error);
