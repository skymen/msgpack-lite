#!/usr/bin/env mocha -R spec

/* jshint -W053, esversion: 11 */

var assert = require("assert");
var msgpackJS = "../index";
var isBrowser = ("undefined" !== typeof window);
var msgpack = isBrowser && window.msgpack || require(msgpackJS);
var TITLE = __filename.replace(/^.*\//, "");
var HAS_BIGINT = ("undefined" !== typeof BigInt);

describe(TITLE, function() {
  var options = {};

  if (!HAS_BIGINT) {
    it.skip("BigInt not supported in this environment", function() {});
    return;
  }

  it("createCodec({bigint: true})", function() {
    var codec = msgpack.createCodec({bigint: true});
    assert.ok(codec);
    options.codec = codec;
  });

  it("encode/decode positive BigInt values", function() {
    [
      0n,
      1n,
      127n, // max fixint
      128n, // min uint8
      255n, // max uint8
      256n, // min uint16
      65535n, // max uint16
      65536n, // min uint32
      4294967295n, // max uint32
      4294967296n, // min uint64
      BigInt(Number.MAX_SAFE_INTEGER),
      BigInt(Number.MAX_SAFE_INTEGER) + 1n,
      BigInt("9007199254740993"), // MAX_SAFE_INTEGER + 2
      BigInt("18446744073709551615") // max uint64
    ].forEach(function(value) {
      var encoded = msgpack.encode(value, options);
      var decoded = msgpack.decode(encoded, options);
      assert.strictEqual(decoded, value, "Failed for value: " + value.toString());
      assert.strictEqual(typeof decoded, "bigint", "Decoded value should be bigint");
    });
  });

  it("encode/decode negative BigInt values", function() {
    [
      -1n,
      -32n, // min fixint
      -33n, // max int8
      -128n, // min int8
      -129n, // max int16
      -32768n, // min int16
      -32769n, // max int32
      -2147483648n, // min int32
      -2147483649n, // max int64
      BigInt("-9007199254740993"), // -(MAX_SAFE_INTEGER + 2)
      BigInt("-9223372036854775808") // min int64
    ].forEach(function(value) {
      var encoded = msgpack.encode(value, options);
      var decoded = msgpack.decode(encoded, options);
      assert.strictEqual(decoded, value, "Failed for value: " + value.toString());
      assert.strictEqual(typeof decoded, "bigint", "Decoded value should be bigint");
    });
  });

  it("encode BigInt with correct type tags", function() {
    // Test fixint
    var encoded = msgpack.encode(0n, options);
    assert.strictEqual(encoded[0], 0x00);

    encoded = msgpack.encode(127n, options);
    assert.strictEqual(encoded[0], 0x7f);

    encoded = msgpack.encode(-1n, options);
    assert.strictEqual(encoded[0], 0xff);

    encoded = msgpack.encode(-32n, options);
    assert.strictEqual(encoded[0], 0xe0);

    // Test uint8
    encoded = msgpack.encode(255n, options);
    assert.strictEqual(encoded[0], 0xcc);
    assert.strictEqual(encoded.length, 2);

    // Test uint16
    encoded = msgpack.encode(65535n, options);
    assert.strictEqual(encoded[0], 0xcd);
    assert.strictEqual(encoded.length, 3);

    // Test uint32
    encoded = msgpack.encode(4294967295n, options);
    assert.strictEqual(encoded[0], 0xce);
    assert.strictEqual(encoded.length, 5);

    // Test uint64
    encoded = msgpack.encode(4294967296n, options);
    assert.strictEqual(encoded[0], 0xcf);
    assert.strictEqual(encoded.length, 9);

    // Test int8
    encoded = msgpack.encode(-128n, options);
    assert.strictEqual(encoded[0], 0xd0);
    assert.strictEqual(encoded.length, 2);

    // Test int16
    encoded = msgpack.encode(-32768n, options);
    assert.strictEqual(encoded[0], 0xd1);
    assert.strictEqual(encoded.length, 3);

    // Test int32
    encoded = msgpack.encode(-2147483648n, options);
    assert.strictEqual(encoded[0], 0xd2);
    assert.strictEqual(encoded.length, 5);

    // Test int64
    encoded = msgpack.encode(-2147483649n, options);
    assert.strictEqual(encoded[0], 0xd3);
    assert.strictEqual(encoded.length, 9);
  });

  it("round-trip conversion", function() {
    var testValues = [
      0n,
      1n,
      -1n,
      BigInt(Number.MAX_SAFE_INTEGER),
      BigInt(Number.MAX_SAFE_INTEGER) + 1n,
      BigInt("-9223372036854775808"), // min int64
      BigInt("18446744073709551615") // max uint64
    ];

    testValues.forEach(function(value) {
      var encoded = msgpack.encode(value, options);
      var decoded = msgpack.decode(encoded, options);
      assert.strictEqual(decoded, value);
    });
  });

  it("encode BigInt in objects and arrays", function() {
    var obj = {
      smallInt: 42n,
      bigInt: BigInt("9007199254740993"),
      negative: -100n
    };

    var encoded = msgpack.encode(obj, options);
    var decoded = msgpack.decode(encoded, options);

    assert.strictEqual(decoded.smallInt, 42n);
    assert.strictEqual(decoded.bigInt, BigInt("9007199254740993"));
    assert.strictEqual(decoded.negative, -100n);

    var arr = [1n, 2n, BigInt("9007199254740993")];
    encoded = msgpack.encode(arr, options);
    decoded = msgpack.decode(encoded, options);

    assert.strictEqual(decoded[0], 1n);
    assert.strictEqual(decoded[1], 2n);
    assert.strictEqual(decoded[2], BigInt("9007199254740993"));
  });

  it("decode without bigint option returns Number", function() {
    var value = BigInt("9007199254740993");
    var encoded = msgpack.encode(value, options);
    
    // Decode without bigint option
    var decoded = msgpack.decode(encoded);
    assert.strictEqual(typeof decoded, "number");
    // Note: This will lose precision for values outside safe integer range
  });
});
