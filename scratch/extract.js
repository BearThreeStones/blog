const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('E:\\Dev\\Unity Text Styles\\Unity Editor UI Toolkit Library (Community).pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('E:\\Dev\\blog\\scratch\\pdf_text.txt', data.text);
    console.log("Extracted PDF text.");
}).catch(err => {
    console.error(err);
});
