const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css'))) {
      callback(filepath);
    }
  }
}

const srcDir = path.resolve(__dirname, 'src');

walk(srcDir, (filepath) => {
  const relPath = path.relative(srcDir, filepath).replace(/\\/g, '/');
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Check if the file is inside faculty/
  if (relPath.startsWith('faculty/')) {
    const parts = relPath.split('/');
    const depth = parts.length - 1;

    if (depth === 2) {
      // e.g. src/faculty/editCiann/Timetable.jsx
      // Adjust imports of utils, config, basic, hooks, styles, layouts to go up one more level
      content = content.replace(/(from\s+['"])\.\.\/(utils|config|basic|hooks|styles|layouts)\//g, '$1../../$2/');
      content = content.replace(/(import\s+['"])\.\.\/(utils|config|basic|hooks|styles|layouts)\//g, '$1../../$2/');
    } else if (depth === 3) {
      // e.g. src/faculty/Attendance/edit/EditIndividualTutorialAttendance.jsx
      // Adjust imports of utils, config, basic, hooks, styles, layouts to go up one more level
      content = content.replace(/(from\s+['"])\.\.\/\.\.\/(utils|config|basic|hooks|styles|layouts)\//g, '$1../../../$2/');
      content = content.replace(/(import\s+['"])\.\.\/\.\.\/(utils|config|basic|hooks|styles|layouts)\//g, '$1../../../$2/');
      
      // Handle any single parent imports that should go up two levels
      content = content.replace(/(from\s+['"])\.\.\/(utils|config|basic|hooks|styles|layouts)\//g, '$1../../$2/');
      content = content.replace(/(import\s+['"])\.\.\/(utils|config|basic|hooks|styles|layouts)\//g, '$1../../$2/');
    }
  } else {
    // Inside other folders (like office, student, admin, pages, basic, etc.)
    // Adjust imports of moved folders to go through faculty/
    const movedFolders = 'components|editCiann|SubjectDetails|Attendance|Assessment|CT|Course|PTMicroProject|PracticalExam|chat';
    
    const regex1 = new RegExp(`(from\\s+['"](\\.\\.\\/)+)(${movedFolders})\\/`, 'g');
    content = content.replace(regex1, '$1faculty/$3/');

    const regex2 = new RegExp(`(import\\s+['"](\\.\\.\\/)+)(${movedFolders})\\/`, 'g');
    content = content.replace(regex2, '$1faculty/$3/');
    
    // Also support single level relative imports if any from root
    const regex3 = new RegExp(`(from\\s+['"]\\.\\/)(${movedFolders})\\/`, 'g');
    content = content.replace(regex3, '$1faculty/$2/');

    const regex4 = new RegExp(`(import\\s+['"]\\.\\/)(${movedFolders})\\/`, 'g');
    content = content.replace(regex4, '$1faculty/$2/');
  }

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated imports in: ${relPath}`);
  }
});
