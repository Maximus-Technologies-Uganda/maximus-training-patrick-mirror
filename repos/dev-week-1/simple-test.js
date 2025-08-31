
const fs = require('fs');
const path = require('path');

// Test if we can create and write to a file
const testFile = path.join(__dirname, 'test-file.txt');
console.log(`Test file path: ${testFile}`);

try {
  // Write to file
  console.log(`Writing to file: ${testFile}`);
  fs.writeFileSync(testFile, 'Test content');
  console.log(`Successfully created ${testFile}`);
  
  // Check if file exists
  if (fs.existsSync(testFile)) {
    console.log(`File exists: ${testFile}`);
    
    // Read file content
    const content = fs.readFileSync(testFile, 'utf-8');
    console.log(`File content: ${content}`);
    
    // Clean up
    fs.unlinkSync(testFile);
    console.log(`Deleted ${testFile}`);
  } else {
    console.error(`File does not exist after writing: ${testFile}`);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(`Error stack: ${error.stack}`);
}

// Test JSON operations
const jsonFile = path.join(__dirname, 'test.json');
console.log(`\
JSON test file path: ${jsonFile}`);

try {
  // Create a test object
  const testObject = {
    name: "Test Item",
    completed: false,
    priority: "high"
  };
  
  // Write JSON to file
  console.log(`Writing JSON to file: ${jsonFile}`);
  fs.writeFileSync(jsonFile, JSON.stringify(testObject, null, 2));
  console.log(`Successfully created JSON file ${jsonFile}`);
  
  // Read and parse JSON
  if (fs.existsSync(jsonFile)) {
    console.log(`JSON file exists: ${jsonFile}`);
    
    const fileContent = fs.readFileSync(jsonFile, 'utf-8');
    console.log(`JSON file content: ${fileContent}`);
    
    const parsedObject = JSON.parse(fileContent);
    console.log(`Parsed object: name=${parsedObject.name}, completed=${parsedObject.completed}, priority=${parsedObject.priority}`);
    
    // Clean up
    fs.unlinkSync(jsonFile);
    console.log(`Deleted JSON file ${jsonFile}`);
  }
} catch (error) {
  console.error(`JSON Error: ${error.message}`);
  console.error(`JSON Error stack: ${error.stack}`);
}

console.log("\
All simple tests completed!");
