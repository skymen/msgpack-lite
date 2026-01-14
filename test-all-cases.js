#!/usr/bin/env node

var msgpack = require("./index");

console.log("=== Comprehensive Number/BigInt Test ===\n");

var testCases = [
  { name: "Small positive number", value: 42, expectedType: "number" },
  {
    name: "Large positive number (uint32)",
    value: 3646498653,
    expectedType: "number",
  },
  {
    name: "Max safe integer",
    value: Number.MAX_SAFE_INTEGER,
    expectedType: "number",
  },
  { name: "Small negative number", value: -42, expectedType: "number" },
  { name: "Large negative number", value: -2147483648, expectedType: "number" },
  { name: "Small BigInt", value: 42n, expectedType: "bigint" },
  {
    name: "Large BigInt (uint32 range)",
    value: 3646498653n,
    expectedType: "bigint",
  },
  {
    name: "BigInt beyond safe integer",
    value: BigInt(Number.MAX_SAFE_INTEGER) + 1n,
    expectedType: "bigint",
  },
  { name: "Negative BigInt", value: -42n, expectedType: "bigint" },
];

var failures = [];

testCases.forEach(function (test) {
  var encoded = msgpack.encode(test.value);
  var decoded = msgpack.decode(encoded);
  var actualType = typeof decoded;
  var pass = actualType === test.expectedType;

  console.log(test.name + ":");
  console.log("  Original:", test.value, "(" + typeof test.value + ")");
  console.log(
    "  Encoded:",
    encoded.length,
    "bytes, format: 0x" + encoded[0].toString(16)
  );
  console.log("  Decoded:", decoded, "(" + actualType + ")");
  console.log("  Expected type:", test.expectedType);
  console.log("  Status:", pass ? "✓ PASS" : "✗ FAIL");
  console.log("");

  if (!pass) {
    failures.push({
      name: test.name,
      expected: test.expectedType,
      actual: actualType,
      value: test.value,
    });
  }
});

if (failures.length > 0) {
  console.log("\n=== FAILURES ===");
  failures.forEach(function (f) {
    console.log(
      "- " + f.name + ": expected " + f.expected + ", got " + f.actual
    );
  });
} else {
  console.log("=== ALL TESTS PASSED ===");
}
