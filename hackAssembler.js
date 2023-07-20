if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}

const filename = process.argv[2];
const path = require('path');
const readline = require('readline');
const fs = require('fs');

let lineCounter = 0;
let freeAddress = 16;
let jumpDest = 0;
let variableTable = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
  R6: 6,
  R7: 7,
  R8: 8,
  R9: 9,
  R10: 10,
  R11: 11,
  R12: 12,
  R13: 13,
  R14: 14,
  R15: 15,
  SCREEN: 16384,
  KBD: 24576,
  SP: 0,
  LCL: 1,
  ARG: 2,
  THIS: 3,
  THAT: 4,
};

function preProcessFile(inputFilePath, outputFilePath) {
  const fileStream = fs.createReadStream(inputFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    ctrlDelay: Infinity,
  });

  rl.on('line', (line) => {
    handleLabel(stripComments(line));
  });

  rl.on('close', () => {
    console.log('Preprocessing done');
    processFile(inputFilePath, outputFilePath);
  });
}

function processFile(inputFilePath, outputFilePath) {
  const fileStream = fs.createReadStream(inputFilePath);
  const writer = fs.createWriteStream(outputFilePath, { flags: 'w' });
  const rl = readline.createInterface({
    input: fileStream,
    ctrlDelay: Infinity,
  });

  rl.on('line', (line) => {
    const processedLine = parse(stripComments(line));
    if (processedLine.length > 0 && processedLine[0] != '(') {
      lineCounter += 1;
      writer.write(processedLine + '\n');
    }
  });

  rl.on('close', () => {
    console.log('Processing done');
    writer.end();
  });
}
const inputFilePath = filename;
const outputFilePath = path.join(
  path.dirname(filename),
  path.basename(filename, path.extname(filename)) + '1' + '.hack'
);

preProcessFile(inputFilePath, outputFilePath);

function stripComments(str) {
  let output = '';
  let comment = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '/' && str[i + 1] && str[i + 1] === '/') {
      comment = true;
    }
    if (!comment && str[i] != '\r') {
      output = output + str[i];
    }
    if (str[i] == '\n') {
      comment = false;
    }
  }

  return output.trim();
}

function parse(line) {
  let output = '';
  if (line.length == 0) {
    return output;
  }
  // determine type of command
  if (line[0] == '(') {
    // do nothing
    return output;
  } else if (line[0] == '@') {
    output = buildAInstruction(line);
    return output;
  } else {
    output = buildCInstruction(line);
    return output;
  }
  //return output;
}

function handleLabel(str) {
  if (str.length < 1) {
    return;
  }
  if (str[0] == '(') {
    let label = str.slice(1, str.length - 1);
    jumpDest = lineCounter;
    variableTable[label] = parseInt(jumpDest);
    return;
  }
  lineCounter++;
  return;
}

function buildAInstruction(str) {
  let varName = str.slice(1);
  let output;

  // If the variable name is not in dict add it
  if (!(varName in variableTable)) {
    // if it is an int
    if (parseInt(varName) === 0 || parseInt(varName)) {
      variableTable[varName] = parseInt(varName);
    } else {
      variableTable[varName] = freeAddress;
      freeAddress += 1;
    }
  }

  let binVal = Number(variableTable[varName]).toString(2);
  output = ('0000000000000000' + binVal).slice(-16);
  if (output.length < 16) {
    console.log('A instruction problem');
    console.log(`output: ${output}`);
    console.log(`line: ${lineCounter}`);
  }
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
    if (str.includes(';')) {
      comp = str.slice(str.indexOf('=') + 1, str.indexOf(';'));
    } else {
      comp = str.slice(str.indexOf('=') + 1, str.length);
    }
    if (dest.includes('M')) {
      d3 = '1';
    }
    if (dest.includes('D')) {
      d2 = '1';
    }
    if (dest.includes('A')) {
      d1 = '1';
    }
  } else if (str.includes(';')) {
    comp = str.slice(0, str.indexOf(';'));
  } else {
    comp = str;
  }

  // if there is a jump
  if (str.includes(';')) {
    let jump = str.slice(str.indexOf(';'));

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
    c = '110001';
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
  if (comp == 'D+A' || comp == 'D+M' || comp == 'A+D' || comp == 'M+D') {
    c = '000010';
  }
  if (comp == 'D-A' || comp == 'D-M') {
    c = '010011';
  }
  if (comp == 'A-D' || comp == 'M-D') {
    c = '000111';
  }
  if (comp == 'D&A' || comp == 'D&M' || comp == 'A&D' || comp == 'M&D') {
    c = '000000';
  }
  if (comp == 'D|A' || comp == 'D|M' || comp == 'A|D' || comp == 'M|D') {
    c = '010101';
  }
  if (comp.includes('M')) {
    a = '1';
  }
  let output = prefix + a + c + d1 + d2 + d3 + j1j2j3;
  if (!c || c.length < 6) {
    console.log(`C instruction problem`);
    console.log(`str: ${str}`);
    console.log(`line: ${lineCounter}`);
    console.log(`c: ${c}`);
    console.log(`previousLine: ${previousLine}`);
  }
  previousLine = str;
  return output;
}

const test1 = stripComments(`
  // This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/06/pong/Pong.asm

// The Pong game program was originally written in the high-level Jack language.
// The Jack code was then translated by the Jack compiler into VM code.
// The VM code was then translated by the VM translator into the Hack
// assembly code shown here.

@20`);

//const test2 =  stripComments(`@20`)
//const testout = parse(test)
//console.log(test1)
