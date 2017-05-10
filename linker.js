let fs = require('fs');
let parser = require('./parser');

class Linker {
    constructor(make) {
        this.make = make;
        this.homepage = '';
        this.sections = {};
        this.pages = [];
        this.configs = {};
    }
    link() {
        // Get the homepage
        let home = this.make.homepage;
        if(home) {
            try {
                let rawHome = fs.readFileSync(`./${home}`, 'utf8').toString();
                this.homepage = rawHome;
            }
            catch (e) {
                this.error(`Couldn't read the homepage. ${e}`);
            }
        }

        let files = fs.readdirSync('./', 'utf8').toString();

        for(let project of this.make.projects) {
            if(!files.includes(project)) {
                this.error(`Project "${project}" listed in make.json but no directory found`);
            }
            try {
                let data = fs.readFileSync(`./${project}/config.json`, 'utf8').toString();
                this.configs[project] = JSON.parse(data);
            }
            catch (e) {
                this.error(`Couldn't read the config of ${project}. ${e}`);
            }
        }

        this.mergePages();

        return {
            homepage: this.homepage,
            pages: this.pages,
            sections: this.sections,
        };
    }


    mergePages() {
        // We want pages in order we get them based on precedence set by make. Set so we get no dupes.
        let pageOrder = new Set();
        // Each key is a page and the value is the set of projects that correspond to it.
        let pageProjects = {};
        // Go through each project and get all its pages
        for(let project of this.make.projects) {
            // Get the pages in order
            let projectsPages = this.configs[project].pageOrder;
            // Add each page to the pages
            for(let page of projectsPages) {
                // Add it to the set, meaning no dupes. Yay!
                pageOrder.add(page);
                // Check if we've initialized the key/value
                if(pageProjects[page]) {
                    pageProjects[page].push(project);
                }
                else {
                    pageProjects[page] = [project];
                }
            }
        }
        // For each page, in order
        for(let page of pageOrder) {
            this.mergePage(page, pageProjects[page]);
        }
    };

    mergePage(page, projects) {
        let pages = {};

        for(let project of projects) {
            try {
                let data = fs.readFileSync(`./${project}/${page}.json`, 'utf8').toString();
                pages[project] = Object.assign({
                    filename: page,
                }, JSON.parse(data));
            }
            catch (e) {
                this.error(`Page ${page} was listed in pageOrder of ${project} but we couldn't read '/${project}/${page}.json'. ${err}`);
            }
        }
        let pageout = parser(this.make.projects, pages);
        this.pages.push(pageout);
        this.sections[page] = pageout[0].sections;
    }

    error(msg) {
        throw new Error(`Linker error: ${msg}`);
    };
}

module.exports = Linker;
