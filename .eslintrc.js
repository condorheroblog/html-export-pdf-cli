module.exports = {
    "env": {
        "commonjs": true,
        "es6": true,
        "node": true,
        "browser":  true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "warn",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars" : ["warn"],
        "no-console" : ["error", { allow: ["log", "warn", "error"] }],
        "no-unused-vars": [
          "error",
          { "vars": "all", "args": "none" }
        ],
        "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
        "valid-jsdoc": ["warn"]
    }
};
