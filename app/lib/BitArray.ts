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

  toBitString(): string {
    let result = '';
    for (let i = 0; i < this.size; i++) {
      result += this.isSet(i) ? '1' : '0';
    }
    return result;
  }
}
