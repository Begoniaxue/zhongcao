type WorkerMessage =
  | { type: 'progress'; chunk: number; total: number }
  | { type: 'hash'; hash: string }
  | { type: 'error'; error: string }

const workerCode = `
  self.onmessage = function(e) {
    const chunks = e.data;
    let bufferList = [];
    const readPromises = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          self.postMessage({ 
            type: 'progress', 
            chunk: i, 
            total: chunks.length 
          });
          resolve(new Uint8Array(event.target.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(chunks[i]);
      });
      readPromises.push(promise);
    }
    
    Promise.all(readPromises).then((buffers) => {
      const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
      
      const hash = calculateMD5(buffers, totalLength);
      
      self.postMessage({ 
        type: 'hash', 
        hash: hash + '-' + totalLength 
      });
    }).catch(err => {
      self.postMessage({ 
        type: 'error', 
        error: err.message || 'Hash calculation failed' 
      });
    });
  };
  
  function calculateMD5(buffers, totalLength) {
    let h = 1732584193;
    let h2 = -271733879;
    let h3 = -1732584194;
    let h4 = 271733878;
    
    let offset = 0;
    let remaining = totalLength;
    
    while (remaining > 0) {
      const chunkSize = Math.min(remaining, 64);
      const block = new Uint8Array(64);
      
      let pos = 0;
      for (let i = 0; i < buffers.length && pos < chunkSize; i++) {
        const buf = buffers[i];
        const available = buf.length - offset;
        if (available > 0) {
          const toCopy = Math.min(available, chunkSize - pos);
          block.set(buf.subarray(offset, offset + toCopy), pos);
          pos += toCopy;
          offset += toCopy;
          if (offset >= buf.length) {
            offset = 0;
          }
        } else if (pos === 0) {
          offset = 0;
        }
      }
      
      if (chunkSize < 64) {
        block[chunkSize] = 0x80;
        
        if (chunkSize >= 56) {
          h = processBlock(block, h, h2, h3, h4);
          const nextBlock = new Uint8Array(64);
          const lengthBits = totalLength * 8;
          nextBlock[56] = lengthBits & 0xff;
          nextBlock[57] = (lengthBits >> 8) & 0xff;
          nextBlock[58] = (lengthBits >> 16) & 0xff;
          nextBlock[59] = (lengthBits >> 24) & 0xff;
          h = processBlock(nextBlock, h, h2, h3, h4);
        } else {
          const lengthBits = totalLength * 8;
          block[56] = lengthBits & 0xff;
          block[57] = (lengthBits >> 8) & 0xff;
          block[58] = (lengthBits >> 16) & 0xff;
          block[59] = (lengthBits >> 24) & 0xff;
          h = processBlock(block, h, h2, h3, h4);
        }
      } else {
        h = processBlock(block, h, h2, h3, h4);
      }
      
      remaining -= chunkSize;
    }
    
    return toHex(h) + toHex(h2) + toHex(h3) + toHex(h4);
  }
  
  function processBlock(block, a, b, c, d) {
    const words = [];
    for (let i = 0; i < 16; i++) {
      words[i] = (block[i * 4] & 0xff) |
                 ((block[i * 4 + 1] & 0xff) << 8) |
                 ((block[i * 4 + 2] & 0xff) << 16) |
                 ((block[i * 4 + 3] & 0xff) << 24);
    }
    
    let aa = a;
    let bb = b;
    let cc = c;
    let dd = d;
    
    const K = [
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
      0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
      0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
      0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
      0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
      0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
      0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
      0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
      0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ];
    
    const s = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    
    for (let i = 0; i < 64; i++) {
      let f, g;
      
      if (i < 16) {
        f = (bb & cc) | ((~bb) & dd);
        g = i;
      } else if (i < 32) {
        f = (dd & bb) | ((~dd) & cc);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = bb ^ cc ^ dd;
        g = (3 * i + 5) % 16;
      } else {
        f = cc ^ (bb | (~dd));
        g = (7 * i) % 16;
      }
      
      f = f + aa + K[i] + words[g];
      aa = dd;
      dd = cc;
      cc = bb;
      bb = bb + ((f << s[i]) | (f >>> (32 - s[i])));
    }
    
    a = a + aa;
    b = b + bb;
    c = c + cc;
    d = d + dd;
    
    return a;
  }
  
  function toHex(n) {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return s;
  }
`

function calculateHash(
  chunks: Blob[],
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    const worker = new Worker(workerUrl)

    worker.onmessage = (e) => {
      const data = e.data as WorkerMessage
      if (data.type === 'progress') {
        onProgress?.((data.chunk + 1) / data.total)
      } else if (data.type === 'hash') {
        URL.revokeObjectURL(workerUrl)
        worker.terminate()
        resolve(data.hash)
      } else if (data.type === 'error') {
        URL.revokeObjectURL(workerUrl)
        worker.terminate()
        reject(new Error(data.error))
      }
    }

    worker.onerror = (e) => {
      URL.revokeObjectURL(workerUrl)
      worker.terminate()
      reject(e)
    }

    worker.postMessage(chunks)
  })
}

export class HashCalculator {
  static async calculate(
    file: File,
    chunkSize: number = 5 * 1024 * 1024,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const sampleCount = 5
    const sampleSize = 2 * 1024 * 1024
    const chunks: Blob[] = []

    if (file.size <= sampleCount * sampleSize) {
      const totalChunks = Math.ceil(file.size / chunkSize)
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        chunks.push(file.slice(start, end))
      }
    } else {
      chunks.push(file.slice(0, sampleSize))
      
      const step = (file.size - sampleSize * 2) / (sampleCount - 1)
      for (let i = 1; i < sampleCount - 1; i++) {
        const start = sampleSize + Math.floor(step * i)
        chunks.push(file.slice(start, start + Math.min(sampleSize, file.size - start)))
      }
      
      chunks.push(file.slice(file.size - sampleSize))
    }

    return calculateHash(chunks, onProgress)
  }
}
