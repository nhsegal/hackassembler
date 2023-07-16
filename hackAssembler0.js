if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}

const filename = process.argv[2];
const path = require('path');
const readline = require('readline');
const fs = require('fs');

function processFile(inputFilePath, outputFilePath) {
  const inputStream = fs.createReadStream(inputFilePath, 'utf8');
  const outputStream = fs.createWriteStream(outputFilePath, 'utf8');

  inputStream.on('data', (chunk) => {
    const lines = chunk.split('\n');
    lines.forEach((line) => {
      const processedLine = parser(stripComments(line));
      if (processedLine.length > 0){
        outputStream.write(processedLine + '\n');
      }
   
    });
  });

  inputStream.on('end', () => {
    // Close the output stream once all lines are written
    outputStream.end();
    console.log('File processing complete.');
  });

  inputStream.on('error', (err) => {
    console.error('Error reading input file:', err);
  });

  outputStream.on('error', (err) => {
    console.error('Error writing to output file:', err);
  });
}

// Usage example

const inputFilePath = filename;
const outputFilePath = path.join(
  path.dirname(filename),
  path.basename(filename, path.extname(filename)) + '.hack'
);

processFile(inputFilePath, outputFilePath);

function stripComments(str) {
  let output = '';
  let comment = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '/' && str[i + 1] && str[i + 1] === '/') {
      comment = true;
    }
    if (!comment) {
      output = output + str[i]; //.trim();
    }
    if (str[i] == '\n') {
      comment = false;
    }
  }
  return output.trim();
}

function parser(line) {
  let output = '';
  if (line.length == 0) return output;
  // determine type of command
  if (line[0] == '@') {
    output = buildAInstruction(line);
  } else {
    output = buildCInstruction(line);
  }
  return output;
}

function buildAInstruction(str) {
  let output = Number(str.slice(1)).toString(2);
  output = ('0000000000000000' + output).slice(-16);
  return output;
}

function buildCInstruction(str) {
  let prefix = '111';
  let d1 = '0';
  let d2 = '0';
  let d3 = '0';
  let j1j2j3 = '000';
  let c = null;
  let comp = null;
  let a = '0';

  // if there is a dest
  if (str.includes('=')) {
    let dest = str.slice(0, str.indexOf('='));
    comp = str.slice(str.indexOf('=') + 1, str.length);
    if (dest.includes('M')) {
      d3 = '1';
    }
    if (dest.includes('D')) {
      d2 = '1';
    }
    if (dest.includes('A')) {
      d1 = '1';
    }
  } else {
    comp = str.slice(0, str.indexOf(';'));
  }

  // if there is a jump
  if (str.includes(';')) {
    let jump = str.slice(str.indexOf(';'));
    console.log(jump)
    if (jump.includes('JGT')) {
      j1j2j3 = '001';
    }
    if (jump.includes('JEQ')) {
      j1j2j3 = '010';
    }
    if (jump.includes('JGE')) {
      j1j2j3 = '011';
    }
    if (jump.includes('JLT')) {
      j1j2j3 = '100';
    }
    if (jump.includes('JNE')) {
      j1j2j3 = '101';
    }
    if (jump.includes('JLE')) {
      j1j2j3 = '110';
    }
    if (jump.includes('JMP')) {
      j1j2j3 = '111';
    }
  }
  // comp bits
  if (comp == '0') {
    c = '101010';
  }
  if (comp == '1') {
    c = '111111';
  }
  if (comp == '-1') {
    c = '111010';
  }
  if (comp == 'D') {
    c = '001100';
  }
  if (comp == 'A' || comp == 'M') {
    c = '110000';
  }
  if (comp == '!D') {
    c = '001101';
  }
  if (comp == '!A' || comp == '!M') {
    c = '11001';
  }
  if (comp == '-D') {
    c = '001111';
  }
  if (comp == '-A' || comp == '-M') {
    c = '110011';
  }
  if (comp == 'D+1') {
    c = '011111';
  }
  if (comp == 'A+1' || comp == 'M+1') {
    c = '110111';
  }
  if (comp == 'D-1') {
    c = '001110';
  }
  if (comp == 'A-1' || comp == 'M-1') {
    c = '110010';
  }
  if (comp == 'D+A' || comp == 'D+M') {
    c = '000010';
  }
  if (comp == 'D-A' || comp == 'D-M') {
    c = '010011';
  }
  if (comp == 'A-D' || comp == 'M-D') {
    c = '000111';
  }
  if (comp == 'D&A' || comp == 'D&M') {
    c = '000000';
  }
  if (comp == 'D|A' || comp == 'D|M') {
    c = '010101';
  }
  if (comp.includes('M')) {
    a = '1';
  }
  //console.log(d1 + d2 + d3)
  let output = prefix + a + c + d1 + d2 + d3 + j1j2j3;
  return output;
}
