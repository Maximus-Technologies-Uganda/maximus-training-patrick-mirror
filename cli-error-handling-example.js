#!/usr/bin/env node

/**
 * Example CLI demonstrating POSIX-compliant error handling with exit codes
 * Standard exit codes:
 * 0 - Success
 * 1 - General error
 * 2 - Misuse of shell command (invalid arguments)
 * 126 - Command cannot execute
 * 127 - Command not found
 * 130 - Command terminated by Ctrl+C
 */

class CLIError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
    this.name = 'CLIError';
  }
}

function validateArgs(args) {
  if (args.length < 3) {
    throw new CLIError('Missing required arguments. Usage: node cli.js <command> <file>', 2);
  }

  const command = args[2];
  const validCommands = ['read', 'write', 'delete'];

  if (!validCommands.includes(command)) {
    throw new CLIError(`Invalid command '${command}'. Valid commands: ${validCommands.join(', ')}`, 2);
  }

  return { command, filePath: args[3] };
}

function handleCommand(command, filePath) {
  switch (command) {
    case 'read':
      // Simulate file not found error
      if (filePath === 'nonexistent.txt') {
        throw new CLIError(`File '${filePath}' not found`, 1);
      }
      console.log(`Reading file: ${filePath}`);
      break;

    case 'write':
      // Simulate permission denied error
      if (filePath.startsWith('/root/')) {
        throw new CLIError(`Permission denied: cannot write to '${filePath}'`, 1);
      }
      console.log(`Writing to file: ${filePath}`);
      break;

    case 'delete':
      console.log(`Deleting file: ${filePath}`);
      break;

    default:
      throw new CLIError(`Unknown command: ${command}`, 2);
  }
}

function main() {
  try {
    const { command, filePath } = validateArgs(process.argv);
    handleCommand(command, filePath);
    console.log('Operation completed successfully');
    process.exit(0);
  } catch (error) {
    if (error instanceof CLIError) {
      console.error(`Error: ${error.message}`);
      process.exit(error.exitCode);
    } else {
      // Unexpected errors
      console.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  console.error('\nOperation cancelled by user');
  process.exit(130);
});

if (require.main === module) {
  main();
}

module.exports = { CLIError, validateArgs, handleCommand };
