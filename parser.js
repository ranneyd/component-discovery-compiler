/**
 * Entry point for parsing
 * Grammar:
 *      json: page
 *      page: name, blurb?, sections
 *      name: string
 *      blurb: string
 *      sections: section[]
 *      section: name, blurb?, (sections|columns|examples)
 *      columns: column[]
 *      column: examples[]
 *      examples: example[]
 *      example: name, content, note?
 *      content: code,
 *      note: string
 * @param {Object} json json to be parsed
 * @returns {Object} sections, output
 */
let entry = json => {
    return page(json);
};
/**
 * Parses the json of a page
 * @param {Object} json json to be parsed
 * @returns {Object} sections, output
 */
let page = json => {
    let output = [];
    if(json.name) {
        output.push({
            type: 'heading',
            level: 1,
            text: json.name,
        });
    }
    else {
        error('Expected page to have a name.', json);
    }

    if(json.blurb) {
        output.push({
            type: 'paragraph',
            text: json.blurb,
        })
    }

    let sections = [];

    if(json.sections) {
        for(let sec of json.sections) {
            sec = section(sec, 2);
            sections.push(sec.name);
            output = output.concat(sec.output);
        }
    }
    else {
        error('Expected page to have sections.', json);
    }

    return {
        sections: sections,
        output: output,
    };
};

/**
 * Parses a section
 * @param {Object} json json to be parsed
 * @param {Number} level level of headings
 * @returns {Object} name, output
 */
let section = (json, level) => {
    let output = [];
    let name;
    if(json.name) {
        name = json.name;
        output.push({
            type: 'heading',
            level: level,
            text: json.name,
        });
    }
    else {
        error('Expected page to have a name.', json);
    }

    if(json.blurb) {
        output.push({
            type: 'paragraph',
            text: json.blurb,
        })
    }

    if(json.sections) {
        for(let sec of json.sections) {
            sec = section(sec, level + 1);
            output = output.concat(sec.output);
        }
    }
    else if(json.columns) {
        let cols = [];
        let numCols = json.columns.length;
        for(let col of json.columns) {
            let examples = [];
            for(let ex of col) {
                ex = example(ex);
                examples.push(ex);
            }
            cols.push(examples);
        }
        output.push({
            type: 'columns',
            length: numCols,
            cols: cols,
        });
    }
    else if(json.examples) {
        for(let ex of json.examples) {
            ex = example(ex);
            output.push(ex);
        }
    }
    else {
        error('Expected page to have sections, columns, or examples.', json);
    }

    return {
        name: name,
        output: output,
    };
};

/**
 * Parses an example
 * @param {Object} json json to be parsed
 * @returns {Object} output
 */
let example = json => {
    let output = {
        type: 'example',
    };
    if(json.name) {
        output.title = json.name;
    }
    else {
        error('Expected example to have a name.', json);
    }

    if(json.content) {
        output.content = json.content;
    }
    else {
        error('Expected example to have content.', json);
    }

    if(json.note) {
        output.note = json.note;
    }

    return output;
};

let error = (msg, json) => {
    throw new Error(`Parse error: ${msg} Raw output: ${JSON.stringify(json)}`);
}

module.exports = entry;