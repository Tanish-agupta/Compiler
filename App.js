import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, RotateCcw, Code, Zap, CheckCircle } from 'lucide-react';


function tokenizer(inputExpression) {
  let current = 0;
  const tokens = [];
  const alphabet = /[a-z]/i;
  const numbers = /[0-9]/;
  const whiteSpace = /\s/;
  
  while (current < inputExpression.length) {
    let char = inputExpression[current];
    
    if (whiteSpace.test(char)) {
      current++;
      continue;
    }
    
    if (char === '(') {
      tokens.push({
        type: 'left_paren',
        value: '('
      });
      current++;
      continue;
    }
    
    if (char === ')') {
      tokens.push({
        type: 'right_paren',
        value: ')'
      });
      current++;
      continue;
    }
    
    if (numbers.test(char)) {
      let value = '';
      while (numbers.test(char)) {
        value += char;
        current++;
        char = inputExpression[current];
      }
      tokens.push({
        type: 'number',
        value: value
      });
      continue;
    }
    
    if (alphabet.test(char)) {
      let value = '';
      while (alphabet.test(char)) {
        value += char;
        current++;
        char = inputExpression[current];
      }
      tokens.push({
        type: 'name',
        value: value
      });
      continue;
    }
    
    throw new Error('Unknown character: ' + char);
  }
  
  return tokens;
}

function parser(tokens) {
  let current = 0;
  
  function walk() {
    let token = tokens[current];
    
    if (token.type === 'number') {
      current++;
      return {
        type: 'NumberLiteral',
        value: token.value
      };
    }
    
    if (token.type === 'left_paren') {
      current++;
      token = tokens[current];
      
      const node = {
        type: 'CallExpression',
        name: token.value,
        params: []
      };
      
      current++;
      token = tokens[current];
      
      while (token.type !== 'right_paren') {
        node.params.push(walk());
        token = tokens[current];
      }
      
      current++;
      return node;
    }
    
    throw new TypeError('Unknown token type: ' + token.type);
  }
  
  const ast = {
    type: 'Program',
    body: []
  };
  
  while (current < tokens.length) {
    ast.body.push(walk());
  }
  
  return ast;
}

function traverser(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }
  
  function traverseNode(node, parent) {
    const method = visitor[node.type];
    if (method) {
      method(node, parent);
    }
    
    switch (node.type) {
      case 'Program':
        traverseArray(node.body, node);
        break;
      case 'CallExpression':
        traverseArray(node.params, node);
        break;
      case 'NumberLiteral':
        break;
      default:
        throw new TypeError('Unknown node type: ' + node.type);
    }
  }
  
  traverseNode(ast, null);
}

function transformer(ast) {
  const newAst = {
    type: 'Program',
    body: []
  };
  
  ast._context = newAst.body;
  
  traverser(ast, {
    NumberLiteral(node, parent) {
      parent._context.push({
        type: 'NumberLiteral',
        value: node.value
      });
    },
    
    CallExpression(node, parent) {
      let expression = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: node.name
        },
        arguments: []
      };
      
      node._context = expression.arguments;
      
      if (parent.type !== 'CallExpression') {
        expression = {
          type: 'ExpressionStatement',
          expression: expression
        };
      }
      
      parent._context.push(expression);
    }
  });
  
  return newAst;
}

function codeGenerator(node) {
  switch (node.type) {
    case 'Program':
      return node.body.map(codeGenerator).join('\n');
    case 'Identifier':
      return node.name;
    case 'NumberLiteral':
      return node.value;
    case 'ExpressionStatement':
      return codeGenerator(node.expression) + ';';
    case 'CallExpression':
      return codeGenerator(node.callee) + '(' + 
             node.arguments.map(codeGenerator).join(', ') + ')';
    default:
      throw new TypeError('Unknown node type: ' + node.type);
  }
}

function compiler(inputExpression) {
  const tokens = tokenizer(inputExpression);
  const ast = parser(tokens);
  const newAst = transformer(ast);
  const output = codeGenerator(newAst);
  return output;
}

export default function LispCompiler() {
  const [input, setInput] = useState('(add 2 (subtract 4 2))');
  const [output, setOutput] = useState('');
  const [tokens, setTokens] = useState([]);
  const [ast, setAst] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  
  const inputRef = useRef(null);
  
  const examples = [
    '(add 2 3)',
    '(subtract 10 5)',
    '(multiply 3 4)',
    '(add 2 (subtract 4 2))',
    '(multiply (add 1 2) (subtract 5 3))',
    '(divide (add 10 5) (subtract 8 3))'
  ];
  
  const compile = () => {
    try {
      setError('');
      
    
      const tokenList = tokenizer(input);
      setTokens(tokenList);
      
   
      const astResult = parser(tokenList);
      setAst(astResult);
      
     
      const result = compiler(input);
      setOutput(result);
    } catch (err) {
      setError(err.message);
      setOutput('');
      setTokens([]);
      setAst(null);
    }
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  const reset = () => {
    setInput('(add 2 (subtract 4 2))');
    setOutput('');
    setTokens([]);
    setAst(null);
    setError('');
    inputRef.current?.focus();
  };
  
  const loadExample = (example) => {
    setInput(example);
    setError('');
  };
  
  useEffect(() => {
    compile();
  }, []);
  
  const renderTokens = () => {
    if (tokens.length === 0) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Tokens
        </h3>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token, index) => (
            <span
              key={index}
              className={`px-2 py-1 rounded text-xs font-mono ${
                token.type === 'left_paren' || token.type === 'right_paren'
                  ? 'bg-purple-100 text-purple-700'
                  : token.type === 'number'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {token.value} ({token.type})
            </span>
          ))}
        </div>
      </div>
    );
  };
  
  const renderAST = () => {
    if (!ast) return null;
    
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
          <Code className="w-4 h-4 mr-2" />
          Abstract Syntax Tree
        </h3>
        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto font-mono text-purple-800">
          {JSON.stringify(ast, null, 2)}
        </pre>
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            LISP to C Compiler
          </h1>
          <p className="text-gray-600">
            Convert LISP expressions to C function calls
          </p>
        </div>
        
        {/* Examples */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Examples:</h2>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-mono transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LISP Expression Input
              </label>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your LISP expression..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={compile}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                Compile
              </button>
              <button
                onClick={reset}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Code className="w-4 h-4 mr-2" />
                {showSteps ? 'Hide' : 'Show'} Steps
              </button>
            </div>
            
            {}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {}
            {showSteps && (
              <div className="space-y-4">
                {renderTokens()}
                {renderAST()}
              </div>
            )}
          </div>
          
          {}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                C Code Output
              </label>
              <div className="relative">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Compiled C code will appear here..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm resize-none"
                />
                {output && (
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Compilation Info */}
            {output && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-1">✓ Compilation Successful</h3>
                <p className="text-green-700 text-sm">
                  Your LISP expression has been successfully compiled to C!
                </p>
              </div>
            )}
          </div>
        </div>
        
        {}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How it Works</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-blue-600 mb-2">1. Tokenization</h3>
              <p className="text-gray-600">
                Breaks down the input into tokens (parentheses, numbers, function names)
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-purple-600 mb-2">2. Parsing</h3>
              <p className="text-gray-600">
                Creates an Abstract Syntax Tree (AST) from the tokens
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-green-600 mb-2">3. Code Generation</h3>
              <p className="text-gray-600">
                Transforms the AST into C-style function calls
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}