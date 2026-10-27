require("dotenv").config();
console.log("RPC:", process.env.SEPOLIA_RPC_URL ? "SET (" + process.env.SEPOLIA_RPC_URL.slice(0, 30) + "...)" : "MISSING");
console.log("KEY:", process.env.PRIVATE_KEY ? "SET (length " + process.env.PRIVATE_KEY.length + ")" : "MISSING");