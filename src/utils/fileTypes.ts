// utils/fileTypes.ts

// Define the literal type for file extensions
export type FileExtensionType = 
  | '.js' | '.jsx' | '.ts' | '.tsx' | '.py' | '.java' | '.cs' | '.cpp' | '.c'
  | '.go' | '.rb' | '.php' | '.swift' | '.kt' | '.rs' | '.sql' | '.sh'
  | '.yml' | '.yaml' | '.json' | '.xml' | '.html' | '.css' | '.scss' | '.less'
  | '.md' | '.markdown' | '.txt' | '.rst' | '.tex' | '.adoc'
  | '.pdf' | '.doc' | '.docx' | '.rtf' | '.odt'
  | '.png' | '.jpg' | '.jpeg' | '.gif' | '.webp' | '.svg'
  | '.env' | '.ini' | '.conf' | '.config' | '.toml';

// Define the file extensions object with proper typing
export const FILE_EXTENSIONS: Record<FileExtensionType, string> = {
  // Code files
  '.js': 'JavaScript',
  '.jsx': 'JavaScript React',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript React',
  '.py': 'Python',
  '.java': 'Java',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.rs': 'Rust',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.yml': 'YAML',
  '.yaml': 'YAML',
  '.json': 'JSON',
  '.xml': 'XML',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.less': 'Less',

  // Documentation files
  '.md': 'Markdown',
  '.markdown': 'Markdown',
  '.txt': 'Plain Text',
  '.rst': 'reStructuredText',
  '.tex': 'LaTeX',
  '.adoc': 'AsciiDoc',

  // Document files
  '.pdf': 'PDF',
  '.doc': 'Word',
  '.docx': 'Word',
  '.rtf': 'Rich Text',
  '.odt': 'OpenDocument Text',

  // Image files
  '.png': 'PNG Image',
  '.jpg': 'JPEG Image',
  '.jpeg': 'JPEG Image',
  '.gif': 'GIF Image',
  '.webp': 'WebP Image',
  '.svg': 'SVG Image',

  // Config files
  '.env': 'Environment Variables',
  '.ini': 'Configuration',
  '.conf': 'Configuration',
  '.config': 'Configuration',
  '.toml': 'TOML'
};

// Define MIME types with proper typing
export type MimeType = keyof typeof MIME_TYPES;

export const MIME_TYPES: Record<string, FileExtensionType[]> = {
  // Text and code files
  'text/plain': ['.txt', '.env', '.ini', '.conf', '.config'],
  'text/markdown': ['.md', '.markdown'],
  'text/x-python': ['.py'],
  'text/x-java': ['.java'],
  'text/x-csharp': ['.cs'],
  'text/x-c++': ['.cpp'],
  'text/javascript': ['.js', '.jsx'],
  'text/typescript': ['.ts', '.tsx'],
  'text/css': ['.css'],
  'text/html': ['.html'],
  'text/x-rust': ['.rs'],
  'text/x-go': ['.go'],
  
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/rtf': ['.rtf'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  
  // Images
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg']
};

export const getFileExtension = (filename: string): FileExtensionType | null => {
  const ext = '.' + filename.split('.').pop()?.toLowerCase() as FileExtensionType;
  return Object.keys(FILE_EXTENSIONS).includes(ext) ? ext : null;
};

export const getMimeTypeFromExtension = (extension: FileExtensionType): MimeType | null => {
  for (const [mimeType, extensions] of Object.entries(MIME_TYPES)) {
    if (extensions.includes(extension)) {
      return mimeType as MimeType;
    }
  }
  return null;
};

export const isCodeFile = (extension: FileExtensionType): boolean => {
  const codeExtensions: FileExtensionType[] = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs', '.cpp', '.c',
    '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.sql', '.sh'
  ];
  return codeExtensions.includes(extension);
};

export const isDocumentationFile = (extension: FileExtensionType): boolean => {
  const docExtensions: FileExtensionType[] = [
    '.md', '.markdown', '.txt', '.rst', '.tex', '.adoc'
  ];
  return docExtensions.includes(extension);
};

export const isConfigFile = (extension: FileExtensionType): boolean => {
  const configExtensions: FileExtensionType[] = [
    '.env', '.ini', '.conf', '.config', '.yml', '.yaml', '.toml'
  ];
  return configExtensions.includes(extension);
};