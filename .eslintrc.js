module.exports = {
    "extends": ["standard", "plugin:react/recommended"],
    "plugins": [
        "standard",
        "promise",
        "react"
    ],
    "parserOptions": {
    	"sourceType": "module",
	    "ecmaFeatures": {
	      "jsx": true
	    }
  	},
    "globals": {
    "document": false,
    "navigator": false,
    "window": false,
    "browser":true,
    "db":true
  	},
    "rules":{
    	"no-console":"error",
    	"comma-dangle": ["error", {
		    "arrays": "never",
		    "objects": "ignore",
		    "imports": "never",
		    "exports": "never",
		    "functions": "never"
    }],
    "indent": ["error", 4, { "SwitchCase": 1 }],
    "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 0 }],
    "no-unused-vars":"warn",
    "no-console":"warn",
    "space-before-function-paren":"off",
    "eqeqeq":"warn"
    }
};
