export class BitArray {
  data: Uint32Array;
  size: number;

  constructor(size: number) {
    this.data = new Uint32Array(Math.ceil(size / 32));
    this.size = size;
  }

  set(index: number) {
    if (index >= 0 && index < this.size) {
      const byteIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      this.data[byteIndex] |= 1 << bitIndex;
    }
  }

  clear(index: number) {
    if (index >= 0 && index < this.size) {
      const byteIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      this.data[byteIndex] &= ~(1 << bitIndex);
    }
  }

  isSet(index: number) {
    if (index >= 0 && index < this.size) {
      const byteIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      return (this.data[byteIndex] & (1 << bitIndex)) !== 0;
    }
    return false;
  }
  nextSet(index: number) {
    if (index >= 0 && index < this.size) {
      const byteIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      for (let i = bitIndex; i < 32; i++) {
        if (this.data[byteIndex] & (1 << i)) {
          return byteIndex * 32 + i;
        }
      }
      for (let i = byteIndex + 1; i < this.data.length; i++) {
        for (let j = 0; j < 32; j++) {
          if (this.data[i] & (1 << j)) {
            return i * 32 + j;
          }
        }
      }
    }
    return -1;
  }

  toBitString(): string {
    let result = '';
    for (let i = 0; i < this.size; i++) {
      result += this.isSet(i) ? '1' : '0';
    }
    return result;
  }
}
