// Test UUID generation
console.log('crypto.randomUUID():', crypto.randomUUID());

// Check if browser has crypto
console.log('typeof crypto:', typeof crypto);
console.log('typeof crypto.randomUUID:', typeof crypto?.randomUUID);

// Check the ID format being used
const id = crypto.randomUUID();
console.log('Generated ID:', id);
console.log('Is valid UUID format:', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
