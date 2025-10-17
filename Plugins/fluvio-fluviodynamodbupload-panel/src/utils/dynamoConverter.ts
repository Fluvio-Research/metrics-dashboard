/**
 * Utilities for converting between DynamoDB AttributeValue format and simplified JSON format
 */

/**
 * Check if an object looks like DynamoDB AttributeValue format
 * Examples: {S: "string"}, {N: "123"}, {BOOL: true}, {M: {...}}, {L: [...]}
 */
export function isDynamoAttributeValue(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  const keys = Object.keys(obj);
  
  // DynamoDB AttributeValue has exactly one key that's a type indicator
  if (keys.length !== 1) {
    return false;
  }

  const typeKey = keys[0];
  const dynamoTypes = ['S', 'N', 'BOOL', 'NULL', 'M', 'L', 'SS', 'NS', 'BS', 'B'];
  
  return dynamoTypes.includes(typeKey);
}

/**
 * Convert a single DynamoDB AttributeValue to simplified format
 */
export function convertDynamoAttributeValue(attr: any): any {
  if (!isDynamoAttributeValue(attr)) {
    return attr;
  }

  const typeKey = Object.keys(attr)[0];
  const value = attr[typeKey];

  switch (typeKey) {
    case 'S': // String
      return value;
    
    case 'N': // Number
      // Convert string number to actual number
      const num = Number(value);
      return isNaN(num) ? value : num;
    
    case 'BOOL': // Boolean
      return value;
    
    case 'NULL': // Null
      return null;
    
    case 'M': // Map (nested object)
      if (typeof value !== 'object' || value === null) {
        return value;
      }
      return convertDynamoObject(value);
    
    case 'L': // List (array)
      if (!Array.isArray(value)) {
        return value;
      }
      return value.map(item => convertDynamoAttributeValue(item));
    
    case 'SS': // String Set
      return Array.isArray(value) ? value : [value];
    
    case 'NS': // Number Set
      if (!Array.isArray(value)) {
        return [value];
      }
      return value.map((n: string) => {
        const num = Number(n);
        return isNaN(num) ? n : num;
      });
    
    case 'BS': // Binary Set
    case 'B':  // Binary
      // Keep as-is, or you could convert to base64 string
      return value;
    
    default:
      return value;
  }
}

/**
 * Convert an entire object from DynamoDB format to simplified format
 */
export function convertDynamoObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertDynamoObject(item));
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Check if this whole object is a DynamoDB AttributeValue
  if (isDynamoAttributeValue(obj)) {
    return convertDynamoAttributeValue(obj);
  }

  // Otherwise, process each property
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isDynamoAttributeValue(value)) {
      result[key] = convertDynamoAttributeValue(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = convertDynamoObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Check if entire JSON payload is in DynamoDB format
 */
export function isDynamoFormatJSON(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Check if it's an array of items
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return false;
    }
    // Check if first item looks like DynamoDB format
    return isDynamoFormatObject(obj[0]);
  }

  // Check single object
  return isDynamoFormatObject(obj);
}

/**
 * Check if an object has properties that look like DynamoDB AttributeValues
 */
function isDynamoFormatObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return false;
  }

  // Check if at least 50% of properties are DynamoDB AttributeValues
  let dynamoCount = 0;
  for (const [_, value] of entries) {
    if (isDynamoAttributeValue(value)) {
      dynamoCount++;
    }
  }

  return dynamoCount >= entries.length * 0.5;
}

/**
 * Auto-convert JSON if it's in DynamoDB format
 */
export function autoConvertIfDynamoFormat(data: any): { converted: boolean; data: any } {
  if (isDynamoFormatJSON(data)) {
    return {
      converted: true,
      data: convertDynamoObject(data)
    };
  }

  return {
    converted: false,
    data: data
  };
}

