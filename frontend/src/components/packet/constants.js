export const DATA_TYPES = [
  { value: 0, label: 'Int8', size: 1 },
  { value: 1, label: 'Int16', size: 2 },
  { value: 2, label: 'Int32', size: 4 },
  { value: 3, label: 'Int64', size: 8 },
  { value: 4, label: 'Uint8', size: 1 },
  { value: 5, label: 'Uint16', size: 2 },
  { value: 6, label: 'Uint32', size: 4 },
  { value: 7, label: 'Uint64', size: 8 },
  { value: 8, label: 'Float32', size: 4 },
  { value: 9, label: 'Float64', size: 8 },
  { value: 10, label: 'String', size: 0 },
  { value: 11, label: 'Hex', size: 0 }
];

export const TYPE_RANGES = {
  0: { min: -128, max: 127 },
  1: { min: -32768, max: 32767 },
  2: { min: -2147483648, max: 2147483647 },
  3: { min: BigInt('-9223372036854775808'), max: BigInt('9223372036854775807') },
  4: { min: 0, max: 255 },
  5: { min: 0, max: 65535 },
  6: { min: 0, max: 4294967295 },
  7: { min: BigInt(0), max: BigInt('18446744073709551615') }
};

export const TYPE_COLORS = {
  0: 'rgba(255, 0, 0, 0.1)',
  1: 'rgba(0, 255, 0, 0.1)',
  2: 'rgba(0, 0, 255, 0.1)',
  3: 'rgba(255, 255, 0, 0.1)',
  4: 'rgba(255, 0, 255, 0.1)',
  5: 'rgba(0, 255, 255, 0.1)',
  6: 'rgba(255, 165, 0, 0.1)',
  7: 'rgba(128, 0, 128, 0.1)',
  8: 'rgba(0, 128, 0, 0.1)',
  9: 'rgba(0, 0, 128, 0.1)',
  10: 'rgba(128, 128, 0, 0.1)',
  11: 'rgba(128, 128, 128, 0.1)'
};
