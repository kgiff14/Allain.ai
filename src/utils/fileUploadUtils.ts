// utils/fileUploadUtils.ts
import { FileExtensionType, FILE_EXTENSIONS, getFileExtension } from './fileTypes';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedExtensions?: FileExtensionType[];
}

const DEFAULT_OPTIONS: FileValidationOptions = {
  maxSizeInMB: 10, // 10MB default limit
  allowedExtensions: [
    // Code files
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs', 
    '.cpp', '.c', '.go', '.rb', '.php', '.swift', '.kt', 
    '.rs', '.sql', '.sh',
    
    // Config files
    '.yml', '.yaml', '.json', '.xml', '.env', '.ini', 
    '.conf', '.config', '.toml',
    
    // Web files
    '.html', '.css', '.scss', '.less',
    
    // Documentation files
    '.md', '.markdown', '.txt', '.rst', '.tex', '.adoc',
    
    // Document files
    '.pdf', '.doc', '.docx', '.rtf', '.odt'
  ]
};

export const validateFile = (
  file: File, 
  options: FileValidationOptions = DEFAULT_OPTIONS
): FileValidationResult => {
  const maxSize = (options.maxSizeInMB || DEFAULT_OPTIONS.maxSizeInMB!) * 1024 * 1024;
  const allowedExtensions = options.allowedExtensions || DEFAULT_OPTIONS.allowedExtensions!;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${options.maxSizeInMB}MB limit`
    };
  }

  // Get and validate file extension
  const extension = getFileExtension(file.name);
  if (!extension) {
    return {
      isValid: false,
      error: 'File type not recognized'
    };
  }

  // Check if extension is allowed
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File type '${FILE_EXTENSIONS[extension]}' is not supported`
    };
  }

  return { isValid: true };
};

export const getFileTypeLabel = (fileName: string): string => {
  const extension = getFileExtension(fileName);
  if (!extension) return 'Unknown Type';
  return FILE_EXTENSIONS[extension] || 'Unknown Type';
};

export const validateFiles = (
  files: FileList | File[], 
  options?: FileValidationOptions
): { valid: File[]; invalid: Array<{ file: File; error: string }> } => {
  const result = {
    valid: [] as File[],
    invalid: [] as Array<{ file: File; error: string }>
  };

  Array.from(files).forEach(file => {
    const validation = validateFile(file, options);
    if (validation.isValid) {
      result.valid.push(file);
    } else {
      result.invalid.push({ file, error: validation.error! });
    }
  });

  return result;
};

// Helper to get appropriate icon based on file type
export const getFileTypeCategory = (fileName: string): 'code' | 'document' | 'config' | 'web' | 'other' => {
  const extension = getFileExtension(fileName);
  if (!extension) return 'other';

  const codeExtensions: FileExtensionType[] = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs',
    '.cpp', '.c', '.go', '.rb', '.php', '.swift', '.kt',
    '.rs', '.sql', '.sh'
  ];

  const configExtensions: FileExtensionType[] = [
    '.yml', '.yaml', '.json', '.xml', '.env', '.ini',
    '.conf', '.config', '.toml'
  ];

  const webExtensions: FileExtensionType[] = [
    '.html', '.css', '.scss', '.less'
  ];

  const documentExtensions: FileExtensionType[] = [
    '.md', '.markdown', '.txt', '.rst', '.tex', '.adoc',
    '.pdf', '.doc', '.docx', '.rtf', '.odt'
  ];

  if (codeExtensions.includes(extension)) return 'code';
  if (configExtensions.includes(extension)) return 'config';
  if (webExtensions.includes(extension)) return 'web';
  if (documentExtensions.includes(extension)) return 'document';
  return 'other';
};