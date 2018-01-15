const fs = require('fs');
const mammoth = require('mammoth');

mammoth.convertToHtml({
   path: './ct_contract.docx'
}, {
    styleMap: [
        "u => span.test",
    ],
}).then(result => {
    console.log('convert message: ', result.messages);
    fs.writeFile('./result/one.html', result.value, err => {
        if (err) {
            console.log('write file error: ', err);
        }
    })
})