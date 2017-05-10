let fs = require('fs');
let Linker = require('./linker');
let generator = require('./generator');

let make;
try {
    let rawMake = fs.readFileSync('make.json', 'utf8').toString();
    make = JSON.parse(rawMake);
}
catch (e) {
    throw new Error(`Couldn't read make file. ${e}`);
}

let linker = new Linker(make);

console.log(JSON.stringify(linker.link(), null, 4));

// let generated = generator(parsed.output);
