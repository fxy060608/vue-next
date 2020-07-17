import deepCopy from '../src/deepCopy'

type PlainObject = {
  [key: string]: any
  [index: number]: any
}

const SIMPLE_TYPES: PlainObject = {
  boolean: true,
  number: 123,
  string: 'foo',
  undef: undefined,
  nan: NaN,
  nil: null,
  object: { key: 'value' },
  array: [1, 2, 3],
  fn() {}
}

const COMPLEX_TYPES: PlainObject = {
  array: ['foo', { bar: 'baz' }],
  object: { foo: { bar: 'baz' } }
}

const UNSUPPORTED_TYPES: PlainObject = {
  error: new Error('boom'),
  promise: Promise.resolve('foo'),
  regexp: /foo/,
  set: new Set().add('foo').add({ bar: { baz: 'quz' } }),
  map: new Map().set('foo', { bar: { baz: 'quz' } }),
  arrayBuffer: new ArrayBuffer(8),
  buffer: new Buffer('this is a test buffer'),
  dataView: new DataView(new ArrayBuffer(16)),
  date: new Date(),
  float32Array: new Float32Array([12, 15]),
  float64Array: new Float64Array([12, 15]),
  int8Array: new Int8Array([12, 15]),
  int16Array: new Int16Array([12, 15]),
  int32Array: new Int32Array([12, 15]),
  blob: new Blob(['<a id="a">hey!</a>'], { type: 'text/html' }),
  uint8Array: new Uint8Array([12, 15]),
  uint8ClampedArray: new Uint8ClampedArray([12, 15]),
  uint16Array: new Uint16Array([12, 15]),
  uint32Array: new Uint32Array([12, 15])
}

describe('deepCopy', () => {
  test('empty', () => {
    const object = {}
    const result = deepCopy(object)
    expect(result).not.toBe(object)
    expect(result).toEqual(object)
  })
  test('simple', () => {
    const result = deepCopy(SIMPLE_TYPES)
    expect(result).not.toBe(SIMPLE_TYPES)
    expect(result).toEqual(SIMPLE_TYPES)
  })
  test('complex', () => {
    const result = deepCopy(COMPLEX_TYPES)
    expect(result).not.toBe(COMPLEX_TYPES)
    expect(result).toEqual(COMPLEX_TYPES)
  })
  test('unsupported', () => {
    Object.keys(UNSUPPORTED_TYPES).forEach(name => {
      const unsupported = {
        [name]: UNSUPPORTED_TYPES[name]
      }
      const result = deepCopy(unsupported)
      expect(result).not.toBe(unsupported)
      expect(result).not.toEqual(unsupported)
    })
  })
})
