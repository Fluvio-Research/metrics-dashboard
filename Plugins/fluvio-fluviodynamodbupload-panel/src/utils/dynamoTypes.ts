export type CanonicalFieldType = 'string' | 'number' | 'boolean' | 'json';

/**
 * Maps DynamoDB attribute types to canonical field types
 */
export function mapDynamoTypeToCanonical(dynamoType: string): CanonicalFieldType {
  if (!dynamoType) return 'string';
  
  const type = dynamoType.toUpperCase();
  
  switch (type) {
    case 'N':        // Number
    case 'NUMBER':
      return 'number';
    
    case 'BOOL':     // Boolean
    case 'BOOLEAN':
      return 'boolean';
    
    case 'M':        // Map (Object)
    case 'MAP':
      return 'json';
    
    case 'L':        // List (Array)
    case 'LIST':
      return 'json';
    
    case 'SS':       // String Set
    case 'NS':       // Number Set
    case 'BS':       // Binary Set
      return 'json';
    
    case 'B':        // Binary
    case 'BINARY':
      return 'string';
    
    case 'NULL':
      return 'string';
    
    case 'S':        // String
    case 'STRING':
    default:
      return 'string';
  }
}

/**
 * Formats a user-friendly label for the detected DynamoDB type
 */
export function formatDynamoTypeLabel(canonicalType: CanonicalFieldType, dynamoType?: string): string {
  const labels: Record<string, string> = {
    'string': dynamoType === 'B' ? 'Binary (B)' : 'String (S)',
    'number': 'Number (N)',
    'boolean': 'Boolean (BOOL)',
    'json': dynamoType === 'M' ? 'Map (M)' : dynamoType === 'L' ? 'List (L)' : 
            dynamoType === 'SS' ? 'String Set (SS)' : dynamoType === 'NS' ? 'Number Set (NS)' :
            dynamoType === 'BS' ? 'Binary Set (BS)' : 'JSON (M/L/Set)',
  };
  return labels[canonicalType] || canonicalType;
}

/**
 * Resolves the effective field type, handling legacy field definitions
 */
export function resolveFieldType(field: { type?: string; dynamoType?: string }): CanonicalFieldType {
  if (!field.type) {
    return field.dynamoType ? mapDynamoTypeToCanonical(field.dynamoType) : 'string';
  }
  
  return normalizeConfiguredType(field.type);
}

/**
 * Normalizes a configured type string to canonical type
 */
export function normalizeConfiguredType(typeStr: string): CanonicalFieldType {
  if (!typeStr) return 'string';
  
  const normalized = typeStr.toLowerCase();
  
  if (normalized === 'string' || normalized === 's') return 'string';
  if (normalized === 'number' || normalized === 'numeric' || normalized === 'n') return 'number';
  if (normalized === 'boolean' || normalized === 'bool') return 'boolean';
  if (normalized === 'json' || normalized === 'map' || normalized === 'object' || normalized === 'list') return 'json';
  
  return 'string';
}
