// read-format.js

/* jshint esversion: 11 */

var ieee754 = require("ieee754");
var Int64Buffer = require("int64-buffer");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

exports.getReadFormat = getReadFormat;
exports.readUint8 = uint8;

var Bufferish = require("./bufferish");
var BufferProto = require("./bufferish-proto");

var HAS_MAP = ("undefined" !== typeof Map);
var HAS_BIGINT = ("undefined" !== typeof BigInt);
var NO_ASSERT = true;

function getReadFormat(options) {
  var binarraybuffer = Bufferish.hasArrayBuffer && options && options.binarraybuffer;
  var int64 = options && options.int64;
  var bigint = HAS_BIGINT && options && options.bigint;
  var usemap = HAS_MAP && options && options.usemap;

  var readFormat = {
    map: (usemap ? map_to_map : map_to_obj),
    array: array,
    str: str,
    bin: (binarraybuffer ? bin_arraybuffer : bin_buffer),
    ext: ext,
    uint8: bigint ? uint8_bigint : uint8,
    uint16: bigint ? uint16_bigint : uint16,
    uint32: bigint ? uint32_bigint : uint32,
    uint64: read(8, bigint ? readUInt64BE_bigint : int64 ? readUInt64BE_int64 : readUInt64BE),
    int8: bigint ? int8_bigint : int8,
    int16: bigint ? int16_bigint : int16,
    int32: bigint ? int32_bigint : int32,
    int64: read(8, bigint ? readInt64BE_bigint : int64 ? readInt64BE_int64 : readInt64BE),
    float32: read(4, readFloatBE),
    float64: read(8, readDoubleBE)
  };

  return readFormat;
}

function map_to_obj(decoder, len) {
  var value = {};
  var i;
  var k = new Array(len);
  var v = new Array(len);

  var decode = decoder.codec.decode;
  for (i = 0; i < len; i++) {
    k[i] = decode(decoder);
    v[i] = decode(decoder);
  }
  for (i = 0; i < len; i++) {
    value[k[i]] = v[i];
  }
  return value;
}

function map_to_map(decoder, len) {
  var value = new Map();
  var i;
  var k = new Array(len);
  var v = new Array(len);

  var decode = decoder.codec.decode;
  for (i = 0; i < len; i++) {
    k[i] = decode(decoder);
    v[i] = decode(decoder);
  }
  for (i = 0; i < len; i++) {
    value.set(k[i], v[i]);
  }
  return value;
}

function array(decoder, len) {
  var value = new Array(len);
  var decode = decoder.codec.decode;
  for (var i = 0; i < len; i++) {
    value[i] = decode(decoder);
  }
  return value;
}

function str(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  return BufferProto.toString.call(decoder.buffer, "utf-8", start, end);
}

function bin_buffer(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return Bufferish.from(buf);
}

function bin_arraybuffer(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return Bufferish.Uint8Array.from(buf).buffer;
}

function ext(decoder, len) {
  var start = decoder.reserve(len+1);
  var type = decoder.buffer[start++];
  var end = start + len;
  var unpack = decoder.codec.getExtUnpacker(type);
  if (!unpack) throw new Error("Invalid ext type: " + (type ? ("0x" + type.toString(16)) : type));
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return unpack(buf);
}

function uint8(decoder) {
  var start = decoder.reserve(1);
  return decoder.buffer[start];
}

function int8(decoder) {
  var start = decoder.reserve(1);
  var value = decoder.buffer[start];
  return (value & 0x80) ? value - 0x100 : value;
}

function uint16(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  return (buffer[start++] << 8) | buffer[start];
}

function int16(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  var value = (buffer[start++] << 8) | buffer[start];
  return (value & 0x8000) ? value - 0x10000 : value;
}

function uint32(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return (buffer[start++] * 16777216) + (buffer[start++] << 16) + (buffer[start++] << 8) + buffer[start];
}

function int32(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return (buffer[start++] << 24) | (buffer[start++] << 16) | (buffer[start++] << 8) | buffer[start];
}

function uint8_bigint(decoder) {
  var start = decoder.reserve(1);
  return BigInt(decoder.buffer[start]);
}

function int8_bigint(decoder) {
  var start = decoder.reserve(1);
  var value = decoder.buffer[start];
  return BigInt((value & 0x80) ? value - 0x100 : value);
}

function uint16_bigint(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  return BigInt((buffer[start++] << 8) | buffer[start]);
}

function int16_bigint(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  var value = (buffer[start++] << 8) | buffer[start];
  return BigInt((value & 0x8000) ? value - 0x10000 : value);
}

function uint32_bigint(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return BigInt((buffer[start++] * 16777216) + (buffer[start++] << 16) + (buffer[start++] << 8) + buffer[start]);
}

function int32_bigint(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  var value = (buffer[start++] << 24) | (buffer[start++] << 16) | (buffer[start++] << 8) | buffer[start];
  return BigInt(value);
}

function read(len, method) {
  return function(decoder) {
    var start = decoder.reserve(len);
    return method.call(decoder.buffer, start, NO_ASSERT);
  };
}

function readUInt64BE(start) {
  return new Uint64BE(this, start).toNumber();
}

function readInt64BE(start) {
  return new Int64BE(this, start).toNumber();
}

function readUInt64BE_int64(start) {
  return new Uint64BE(this, start);
}

function readInt64BE_int64(start) {
  return new Int64BE(this, start);
}

function readUInt64BE_bigint(start) {
  var buffer = this;
  var value = 0n;
  for (var i = 0; i < 8; i++) {
    value = (value << 8n) | BigInt(buffer[start + i]);
  }
  return value;
}

function readInt64BE_bigint(start) {
  var buffer = this;
  var value = 0n;
  for (var i = 0; i < 8; i++) {
    value = (value << 8n) | BigInt(buffer[start + i]);
  }
  // Check if the sign bit is set (negative number in two's complement)
  if (value >= 0x8000000000000000n) {
    value -= 0x10000000000000000n;
  }
  return value;
}

function readFloatBE(start) {
  return ieee754.read(this, start, false, 23, 4);
}

function readDoubleBE(start) {
  return ieee754.read(this, start, false, 52, 8);
}