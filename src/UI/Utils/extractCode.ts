const extractSolutionClassBlock = (userCode: string, language: string|undefined): string => {
  const lines = userCode.split('\n');
  let startIndex = -1;

  // Language-specific match
  const classPattern = {
    python: /^class\s+Solution\b/,
    java: /^public\s+class\s+Solution\b/,
    cpp: /^class\s+Solution\b/,
    javascript: /^class\s+Solution\b/
  }[language?language.toLowerCase():'C++'] || /^class\s+Solution\b/;

  // Step 1: Find where Solution class starts
  for (let i = 0; i < lines.length; i++) {
    if (classPattern.test(lines[i].trim())) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {return '';}
  const classLines = [];
  const baseIndent = lines[startIndex].match(/^(\s*)/)?.[1] ?? '';
  let openBraces = 0;
  let insideClass = false;
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    classLines.push(line);

    // Python: use indentation-based parsing
    if ((language && language.toLowerCase() === 'python') ||(language && language.toLowerCase() === 'python3')) {
      const indent = line.match(/^(\s*)/)?.[1] ?? '';
      if (i > startIndex && indent.length <= baseIndent.length && line.trim()) {
        classLines.pop(); // Don't include this line
        break;
      }
    } else {
      // Bracket-based languages (Java, C++, JS)
      openBraces += (line.match(/{/g) || []).length;
      openBraces -= (line.match(/}/g) || []).length;
      if (openBraces === 0 && insideClass) {break;}
      if (line.includes('{')){insideClass = true;}
    }
  }

  return classLines.join('\n').trim();
};
export default extractSolutionClassBlock;