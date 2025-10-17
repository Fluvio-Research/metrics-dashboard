import { ParsedFileData } from '../types';

export class FileParser {
  static async parseCSV(file: File, delimiter: string = ','): Promise<ParsedFileData> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    const headers = this.parseCSVLine(lines[0], delimiter);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      if (values.length === 0) {
        continue;
      }
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return {
      headers,
      rows,
      fileName: file.name,
      rowCount: rows.length,
    };
  }

  static async parseJSON(file: File): Promise<ParsedFileData> {
    const text = await file.text();
    const parsed = JSON.parse(text);
    
    let rows: Record<string, string>[];
    if (Array.isArray(parsed)) {
      rows = parsed.map(item => this.flattenObject(item));
    } else if (typeof parsed === 'object' && parsed !== null) {
      rows = [this.flattenObject(parsed)];
    } else {
      throw new Error('JSON must be an object or array of objects');
    }

    if (rows.length === 0) {
      throw new Error('No data found in JSON file');
    }

    const headers = Array.from(
      new Set(rows.flatMap(row => Object.keys(row)))
    );

    return {
      headers,
      rows,
      fileName: file.name,
      rowCount: rows.length,
    };
  }

  static async parseText(file: File, pattern?: string): Promise<ParsedFileData> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    const rows: Record<string, string>[] = [];
    
    if (pattern) {
      const regex = new RegExp(pattern);
      lines.forEach((line, index) => {
        const match = line.match(regex);
        if (match) {
          const row: Record<string, string> = { line_number: String(index + 1) };
          match.slice(1).forEach((value, i) => {
            row[`field_${i + 1}`] = value || '';
          });
          rows.push(row);
        }
      });
    } else {
      lines.forEach((line, index) => {
        rows.push({
          line_number: String(index + 1),
          content: line,
        });
      });
    }

    const headers = rows.length > 0 ? Object.keys(rows[0]) : ['content'];

    return {
      headers,
      rows,
      fileName: file.name,
      rowCount: rows.length,
    };
  }

  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private static flattenObject(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }

      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = String(value);
      }
    }

    return result;
  }

  static detectFileType(file: File): 'csv' | 'json' | 'text' {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      return 'json';
    } else if (extension === 'csv' || extension === 'tsv') {
      return 'csv';
    } else {
      return 'text';
    }
  }

  static async parseFile(file: File, options?: { delimiter?: string; pattern?: string }): Promise<ParsedFileData> {
    const fileType = this.detectFileType(file);
    
    switch (fileType) {
      case 'json':
        return this.parseJSON(file);
      case 'csv':
        return this.parseCSV(file, options?.delimiter || ',');
      case 'text':
        return this.parseText(file, options?.pattern);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}

