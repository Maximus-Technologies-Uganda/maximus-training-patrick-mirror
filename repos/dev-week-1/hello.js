// Get command-line arguments
const args = process.argv.slice(2);

// Get the name (the first argument) or default to 'World'
const name = args[0] || 'World';

// Check if the '--shout' flag is included
const shouldShout = args.includes('--shout');

// Build the greeting
let greeting = `Hello, ${name}!`;

// Make it uppercase if shouldShout is true
if (shouldShout) {
  greeting = greeting.toUpperCase();
}

console.log(greeting);