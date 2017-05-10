let fs = require('fs');

let generator = elements => {
    let output = '';
    let filename = '';
    for(let elem of elements) {
        switch(elem.type) {
            case 'page':
                filename = elem.filename;
                output = '<html><head><title>Demo Site</title></head><body>';
                break;
            case 'endpage':
                output = '</body></head>';
                fs.writeFile(`/output/${filename}`, output, err => {
                    error(`Couldn't write to file '${filename}'. Error: ${err}`);
                });
                filename='';
                output = '';
                break;
            case 'heading':
                output += heading(elem);
                break;
            case 'columns':
                output += columns(elem);
                break;
            default:
                error(`Unknown type: ${elem.type}.`);
        }
    }
};

/**
 * Generate a header.
 * @param {Object} elem heading object. Should have "level" property and "text" property
 */
let heading = elem => {
    let level = 1;
    if(elem.level) {
        level = elem.level;
    }
    else {
        error('Heading requires a level.', elem);
    }
    if(elem.text) {
        return `<h${level}>${elem.text}</h${level}>`;
    }
    else {
        error('Heading requires text.', elem);
    }
};
/**
 * Generate columns.
 * @param {Object} elem columns object. Should have "length" property indicating the number of columns and and a "cols"
 * property, an array of arrays of examples.
 */
let columns = elem => {
    let output = '';
    for(let col of elem.cols) {
        let colHTML = `<div style="width:50%; display:inline-block; vertical-align: top">`;
        for(let ex of col) {
            colHTML += example(ex);
        }
        colHTML += '</div>';
        output += colHTML;
    }

    return output;
};

/**
 * Generate an example.
 * @param {Object} elem example object. Should have a "name" property with the name of the example, a "content" prop
 * with the content of the example, and an optional "note" property with a note.
 */
let example = elem => {
    let output = '';
    if(elem.name) {
        output += `<p><strong>${elem.name}</strong></p>`;
    }
    else {
        error('Example requires a name.', elem);
    }
    if(elem.content) {
        output += elem.content;
        output += `<code><pre>${escapeHTML(elem.content)}</pre></code>`;
    }
    else {
        error('Example requires content.', elem);
    }
    if(elem.note) {
        output += `<p>${elem.note}</p>`;
    }

    return output;
}

const ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};
/**
 * Escapes HTML
 * http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
 * @param {string} s string to escape
 * @returns {string} escaped string
 */
function escapeHTML(s) {
    return s.replace(/[&<>'"]/g, function(c) {
        return ESC_MAP[c];
    });
}

let error = (msg, elem) => {
    throw new Error(`Generator error: ${msg}${elem ? ` Raw output: ${JSON.stringify(elem)}` : ''}`);
}

module.exports = generator;