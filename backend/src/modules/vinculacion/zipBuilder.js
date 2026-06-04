const fs = require('fs');

/**
 * Constructor ZIP minimo sin dependencias externas.
 * Usa metodo STORE (sin compresion) para empaquetar PDFs ya generados.
 */
class ZipBuilder {
  constructor() {
    this.files = [];
    this.crcTable = this.buildCrcTable();
  }

  buildCrcTable() {
    const table = new Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  }

  crc32(buffer) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buffer.length; i += 1) {
      crc = (crc >>> 8) ^ this.crcTable[(crc ^ buffer[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  addFileFromPath(name, filePath) {
    this.files.push({ name, data: fs.readFileSync(filePath) });
  }

  build() {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    this.files.forEach((file) => {
      const name = Buffer.from(file.name);
      const crc = this.crc32(file.data);
      const local = Buffer.alloc(30);

      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4);
      local.writeUInt16LE(0, 6);
      local.writeUInt16LE(0, 8);
      local.writeUInt16LE(0, 10);
      local.writeUInt16LE(0, 12);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(file.data.length, 18);
      local.writeUInt32LE(file.data.length, 22);
      local.writeUInt16LE(name.length, 26);
      local.writeUInt16LE(0, 28);

      localParts.push(local, name, file.data);

      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0);
      central.writeUInt16LE(20, 4);
      central.writeUInt16LE(20, 6);
      central.writeUInt16LE(0, 8);
      central.writeUInt16LE(0, 10);
      central.writeUInt16LE(0, 12);
      central.writeUInt16LE(0, 14);
      central.writeUInt32LE(crc, 16);
      central.writeUInt32LE(file.data.length, 20);
      central.writeUInt32LE(file.data.length, 24);
      central.writeUInt16LE(name.length, 28);
      central.writeUInt16LE(0, 30);
      central.writeUInt16LE(0, 32);
      central.writeUInt16LE(0, 34);
      central.writeUInt16LE(0, 36);
      central.writeUInt32LE(0, 38);
      central.writeUInt32LE(offset, 42);

      centralParts.push(central, name);
      offset += local.length + name.length + file.data.length;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(this.files.length, 8);
    end.writeUInt16LE(this.files.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, ...centralParts, end]);
  }
}

module.exports = ZipBuilder;
