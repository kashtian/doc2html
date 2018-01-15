const fs = require('fs');

readXml('./contract.xml');

function readXml(filePath) {
    fs.readFile(filePath || './format.xml', {
        encoding: 'utf-8'
    }, (err, data) => {
        if (err) {
            console.log('read file error: ', err);
            return;
        }
        let numStr = data.match(/<w:numbering [\s\S]*?>[\s\S]*?<\/w:numbering>/) || [];
        getContent(data, getNumberInfo(numStr[0]))
    })
}

function getNumberInfo(str) {
    if (!str) {
        return {};
    }
    let arr = str.match(/<w:abstractNum w:abstractNumId="\d+">[\s\S]*?<\/w:abstractNum>/ig) || [];
    let abstract = {}, itemArr, info = {};
    arr.forEach((item, index) => {        
        itemArr = item.match(/<w:start w:val="(\d+)"\/>[\s\S]*?<w:numFmt w:val="(\w+)"\/>[\s\S]*?<w:lvlText w:val="(\S+)"\/>/) || [];
       // console.log('item arr---->', itemArr);
        abstract[index] = {
            start: itemArr[1],
            numFmt: itemArr[2],
            lvlText: itemArr[3]
        };
    })
    
    let map = getNumMap(str);
    for (let key in map) {
        info[key] = abstract[map[key]]
    }
    // console.log('num info---->', info);
    return info;
}

function getNumMap(str) {
    if (!str) {
        return {};
    }
    let arr = str.match(/<w:num w:numId="(\d+)"><w:abstractNumId w:val="(\d+)"\/><\/w:num>/ig) || [];
    let numMap = {}, itemArr;
    arr.forEach(item => {
        itemArr = item.match(/<w:num w:numId="(\d+)"><w:abstractNumId w:val="(\d+)"\/><\/w:num>/) || [];
        itemArr[1] && (numMap[itemArr[1]] = itemArr[2]);
    })
    // console.log('num map---->', numMap);
    return numMap;
}

function getContent(contentXml, numInfo) {
    let str = "", countMap = {}, num, itemStr = '', head = '';
    contentXml.match(/(<w:p>|<w:p [\s\S]*?>)[\s\S]*?(<w:t>|<w:t [\s\S]*?>)[\s\S]*?<\/w:t>[\s\S]*?<\/w:p>/ig).forEach(item => {
        num = item.match(/<w:numId w:val="(\d+)"\/>/);
        itemStr = '';
        console.log('num----->', num)
        if (num) {
            head = `<div class="title-${num[1]}">`;
            if (!countMap[num[1]]) {
                countMap[num[1]] = parseInt(numInfo[num[1]].start);
            } else {
                countMap[num[1]]++;
            }            
        } else {
            head = '<div>';
        }
        item.match(/(<w:t>|<w:t [\s\S]*?>)[\S\s]+?<\/w:t>/ig).forEach((value, i) => {
            //  console.log('value------->', value);
             itemStr += value.replace(/(<w:t>|<w:t [\s\S]*?>)/, (num && i == 0) ? getAbstract(num[1], numInfo, countMap) : '').replace("</w:t>","").trim();
        })
        if (itemStr.trim()) {
            str += head + itemStr + '</div>';
        }     
    })
    fs.writeFile('./test.html', str, err => {
        if (err) {
            console.log('wirte error: ', err);
        }
    })
}

function getAbstract(key, numInfo, countMap) {
    if (numInfo[key].lvlText) {
        let s = numInfo[key].lvlText.replace('%1', getRealNum(countMap[key], numInfo[key].numFmt));
        //console.log(`${key}========>`, s)
        return s;
    }
    return '';
}

function getRealNum(num, lang) {
    if (lang == 'lowerLetter') {
        return (num + 9).toString(16);
    } else if (lang == 'upperLetter') {
        return (num + 9).toString(16).toUpperCase();
    } else if (/chinese/.test(lang)) {
        return n2c(num);
    } else {
        return num;
    }
}

// 阿拉伯数字转中文数字(只支持到百位数)
function n2c(num) {
    if (!num) {
        return '';
    }
    let arr0 = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"],
        arr1 = ["", "十", "百"],
        newarr = [];

    num += '';
    num = num.split('').reverse();
    num.forEach((v, index) => {
        if (v == 0) {
            switch(index % 3) {
                case 0:
                case 1:
                    if (num[0] != 0) {
                        newarr.push(arr0[0]);
                    }                    
            }
        } else {
            newarr.push(arr0[v] + arr1[index % 3]);
        }        
    })
    let newstr = newarr.reverse().join('');
    if (num.length == 2 && num[1] == 1 ) {
        newstr = newstr.slice(1);
    } else if (num.length > 2 && newstr[newstr.length - 1] == '十') {
        newstr = newstr.slice(0, newstr.length - 1);
    }
    return newstr;
}