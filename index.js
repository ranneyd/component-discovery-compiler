let fs = require('fs');
let parser = require('./parser');
let generator = require('./generator');

if (process.argv.length <= 2) {
    console.log("Give me a file to compile pl0x");
    process.exit(-1);
}

let filename = process.argv[2];

let rawJSON = fs.readFileSync(filename, 'utf8').toString();

let json = JSON.parse(rawJSON);

let parsed = parser(json);

let generated = generator(parsed.output);

console.log(generated);
