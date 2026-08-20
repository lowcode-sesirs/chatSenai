import fs from 'node:fs';
import path from 'node:path';

const filesToRemove = [
  path.resolve('dist', 'vite.svg'),
  path.resolve('dist', '404.html'),
];

for (const filePath of filesToRemove) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed ${filePath}`);
    }
  } catch (error) {
    console.warn(`Failed to remove ${filePath}:`, error.message);
  }
}
