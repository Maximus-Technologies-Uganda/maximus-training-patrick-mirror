// 1. Start with a JavaScript object (an array of objects)
const users = [
    { name: 'Alice', id: 1 },
    { name: 'Bob', id: 2 }
  ];
  console.log('Original JavaScript Object:', users);
  
  // 2. Stringify it to prepare for saving
  const jsonString = JSON.stringify(users, null, 2);
  console.log('\nAs a JSON String:\n', jsonString);
  
  // 3. Parse it to bring it back to a usable object
  const parsedObject = JSON.parse(jsonString);
  console.log('\nParsed back to a JavaScript Object:', parsedObject);
  
  // You can now access properties from the parsed object
  console.log('\nAccessing a property:', parsedObject[0].name); // Outputs: Alice