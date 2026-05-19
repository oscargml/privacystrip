declare module 'piexifjs' {
  interface ExifDict {
    '0th'?: Record<number, unknown>;
    'Exif'?: Record<number, unknown>;
    'GPS'?: Record<number, unknown>;
    'Interop'?: Record<number, unknown>;
    '1st'?: Record<number, unknown>;
  }
  function load(dataURL: string): ExifDict;
  function dump(exifObj: ExifDict): string;
  function insert(exifStr: string, dataURL: string): string;
  function remove(dataURL: string): string;
  const TagValues: Record<string, Record<string, number>>;
  export { load, dump, insert, remove, TagValues };
  export default { load, dump, insert, remove, TagValues };
}
