let order;
let filename;
let sections;

/**
 * Entry point for parsing
 * Grammar:
 *      page: name, blurb?, sections
 *      name: string
 *      blurb: string
 *      sections: section[]
 *      section: name, blurb?, (sections|columns|examples)?
 *      columns: example[]
 *      examples: example[]
 *      example: name, content, note?
 *      content: code,
 *      note: string
 * @param {Object} json json to be parsed
 * @returns {Object} output
 */
let entry = (projectOrder, jsons) => {
    order = projectOrder;
    let mainJSON = getMainJSON(jsons)
    filename = mainJSON.filename || error('Page filename missing', mainJSON);
    return page(jsons);
}

let page = jsons => {
    let output = [];
    let mainJSON = getMainJSON(jsons);
    if(mainJSON.name) {
        output.push({
            type: 'heading',
            level: 1,
            text: mainJSON.name,
        });
    }
    else {
        error(`Expected ${order[0]}'s page '${filename}' to have a name.`, mainJSON);
    }

    if(mainJSON.blurb) {
        output.push({
            type: 'paragraph',
            text: mainJSON.blurb,
        })
    }

    // Each section of the page will be in this hash
    let sections = {};
    // This set will maintain their order
    let sectionOrder = new Set();

    // Link the project's sections
    for(let project of order) {
        // Get this project's page json
        let json = jsons[project];
        // If this project isn't here, skip it
        if (!json) {
            continue;
        }
        // Sections? If not we have a problem
        if(json.sections) {
            // For each section, either tack it on to an existing section array or make a new one
            for(let sec of json.sections) {
                // Sections need names. We're using them as keys, so check now.
                if(!sec.name) {
                    error(`Expected a section of ${project}'s page '${filename}' to have a name.`, json);
                }
                // Have we seen this section name before?
                if(sections[sec.name]) {
                    // Just tack it on.
                    sections[sec.name][project] = sec;
                }
                else {
                    // Haven't seen it, so initialize and add to our set.
                    sections[sec.name] = {};
                    sections[sec.name][project] = sec;
                    sectionOrder.add(sec.name);
                }
            }
        }
        else {
            error(`Expected ${project}'s page '${filename}' to have sections.`, json);
        }
    }

    // parse each section
    for(let sec of sectionOrder) {
        output =  output.concat(section(sections[sec], 2));
    }

    output.push({
        type: 'endpage'
    });



    return [{
        type: 'sections',
        sections: [...sectionOrder],
    }, ...output];
};


let section = (jsons, level) => {
    let output = [];
    let mainJSON = getMainJSON(jsons);
    // We know each section has a name because we check in page
    output.push({
        type: 'heading',
        level: level,
        text: mainJSON.name,
    });

    if(mainJSON.blurb) {
        output.push({
            type: 'paragraph',
            text: mainJSON.blurb,
        })
    }

    // Each section of the page will be in this hash
    let sections = {};
    // This set will maintain their order
    let sectionsOrder = new Set();
    // Each section of the page will be in this hash
    let columnExamples = {};
    // This set will maintain their order
    let columnExamplesOrder = new Set();
    // Each section of the page will be in this hash
    let examples = {};
    // This set will maintain their order
    let examplesOrder = new Set();

    // Link the project's stuff
    for(let project of order) {
        // Get this project's section json
        let json = jsons[project];
        // If this project isn't here, skip it
        if (!json) {
            continue;
        }

        if(json.sections) {
            // For each section, either tack it on to an existing section array or make a new one
            for(let sec of json.sections) {
                // Sections need names. We're using them as keys, so check now.
                if(!sec.name) {
                    error(`Expected the ${mainJSON.name} section of ${project}'s page '${filename}' to have a name.`, sec);
                }
                // Have we seen this section name before?
                if(sections[sec.name]) {
                    // Just tack it on.
                    sections[sec.name][project] = sec;
                }
                else {
                    // Haven't seen it, so initialize and add to our set.
                    sections[sec.name] = {};
                    sections[sec.name][project] = sec;
                    sectionsOrder.add(sec.name);
                }
            }
        }
        if(json.columns) {
            for(let ex of json.columns) {
                // Examples need names. We're using them as keys, so check now.
                if(!ex.name) {
                    error(`Expected an example in the ${mainJSON.name} section of ${project}'s page '${filename}' to have a name.`, ex);
                }
                // Have we seen this example name before?
                if(columnExamples[ex.name]) {
                    // Just tack it on.
                    columnExamples[ex.name][project] = ex;
                }
                else {
                    // Haven't seen it, so initialize and add to our set.
                    columnExamples[ex.name] = {};
                    columnExamples[ex.name][project] = ex;
                    columnExamplesOrder.add(ex.name);
                }
            }
        }
        if(json.examples) {
            for(let ex of json.examples) {
                // Examples need names. We're using them as keys, so check now.
                if(!ex.name) {
                    error(`Expected an example in the ${mainJSON.name} section of ${project}'s page '${filename}' to have a name.`, ex);
                }
                // Have we seen this example name before?
                if(examples[ex.name]) {
                    // Just tack it on.
                    examples[ex.name][project] = ex;
                }
                else {
                    // Haven't seen it, so initialize and add to our set.
                    examples[ex.name] = {};
                    examples[ex.name][project] = ex;
                    examplesOrder.add(ex.name);
                }
            }
        }
    }

    if(examplesOrder.size) {
        for(let ex of examplesOrder) {
            output.push(example(examples[ex]));
        }
    }
    if(columnExamplesOrder.size) {
        let cols = [[],[]];
        let left = true;
        for(let ex of columnExamplesOrder) {
            if (left) {
                cols[0].push(example(columnExamples[ex]));
            }
            else {
                cols[1].push(example(columnExamples[ex]));
            }
            left = !left;
        }
        output.push({
            type: 'columns',
            cols: cols,
        });
    }
    if(sectionsOrder.size) {
        for(let sec of sectionsOrder) {
            output = output.concat(section(sections[sec], level + 1));
        }
    }

    return output;
};

let example = jsons => {
    let mainJSON = getMainJSON(jsons);

    let output = {
        type: 'example',
        title: mainJSON.name,
    };
    for(let project of order) {
        // Get this project's section json
        let json = jsons[project];
        // If this project isn't here, skip it
        if (!json) {
            continue;
        }

        if (json.content) {
            if (!output.content) {
                output.content = [];
            }
            output.content.push({
                project: project,
                content: json.content,
            });
        }
        else {
            error('Expected example to have content.', json);
        }
        if (json.note) {
            if (!output.note) {
                output.note = [];
            }
            output.note.push({
                project: project,
                note: json.note,
            });
        }
    }
    return output;
};

let getMainJSON = jsons => {
    for(let project of order) {
        if(jsons[project]) {
            return jsons[project];
        }
    }
    error('No projects found.', jsons);
}

let error = (msg, json) => {
    throw new Error(`Parse error: ${msg} Raw output: ${JSON.stringify(json)}`);
}

module.exports = entry;