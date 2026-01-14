#!/usr/bin/env node

var msgpack = require("./index");

console.log("=== Testing Number vs BigInt ===\n");

// Test with regular Numbers (not BigInt)
var objWithNumbers = {
  url: "/steam/raw",
  body: {
    namespace: "workshop",
    method: "updateItem",
    args: [3646498653, { foo: "bar" }, 3870330], // All regular Numbers
  },
  correlationId: "5uo9j2a6ft3",
};

console.log("Original object (all Numbers):");
console.log(objWithNumbers);
console.log(
  "\nType of args[0]:",
  typeof objWithNumbers.body.args[0],
  "(should be number)"
);
console.log(
  "Type of args[2]:",
  typeof objWithNumbers.body.args[2],
  "(should be number)"
);

var encoded = msgpack.encode(objWithNumbers);
console.log("\nEncoded length:", encoded.length, "bytes");

// Check what format codes are used
console.log("\nFormat codes in encoded data:");
for (var i = 0; i < Math.min(20, encoded.length); i++) {
  console.log(
    "  [" + i + "]:",
    "0x" + encoded[i].toString(16).padStart(2, "0")
  );
}

var decoded = msgpack.decode(encoded);

console.log("\nDecoded object:");
console.log(decoded);
console.log(
  "\nType of args[0]:",
  typeof decoded.body.args[0],
  "(should be number)"
);
console.log(
  "Type of args[2]:",
  typeof decoded.body.args[2],
  "(should be number)"
);

console.log("\n=== Now with BigInt ===\n");

var objWithBigInt = {
  url: "/steam/raw",
  body: {
    namespace: "workshop",
    method: "updateItem",
    args: [3646498653n, { foo: "bar" }, 3870330], // First is BigInt
  },
  correlationId: "5uo9j2a6ft3",
};

console.log("Original object (mixed):");
console.log(objWithBigInt);
console.log(
  "\nType of args[0]:",
  typeof objWithBigInt.body.args[0],
  "(should be bigint)"
);
console.log(
  "Type of args[2]:",
  typeof objWithBigInt.body.args[2],
  "(should be number)"
);

var encodedBigInt = msgpack.encode(objWithBigInt);
console.log("\nEncoded length:", encodedBigInt.length, "bytes");

var decodedBigInt = msgpack.decode(encodedBigInt);

console.log("\nDecoded object:");
console.log(decodedBigInt);
console.log(
  "\nType of args[0]:",
  typeof decodedBigInt.body.args[0],
  "(should be bigint)"
);
console.log(
  "Type of args[2]:",
  typeof decodedBigInt.body.args[2],
  "(should be number)"
);

console.log("\n=== Problem? ===");
if (typeof decoded.body.args[0] !== "number") {
  console.log(
    "ERROR: Regular Number was decoded as",
    typeof decoded.body.args[0]
  );
} else {
  console.log("OK: Numbers stay as Numbers");
}
