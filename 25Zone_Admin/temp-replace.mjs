import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.join(__dirname, "app");

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith(".tsx") || filepath.endsWith(".ts"))) {
      callback(filepath);
    }
  });
}

const isSuccess = (msg) => {
  const lower = msg.toLowerCase();
  return lower.includes("thành công") || lower.includes("đăng nhập thành công");
};

walkSync(appDir, (filepath) => {
  let content = fs.readFileSync(filepath, "utf8");
  
  if (content.includes("alert(")) {
    // Check if we need to import toast
    let modified = false;
    
    // We will use regex to find alert( ... )
    // A simple regex to catch alert(something)
    // We must handle nested parens and quotes, which is tricky with regex.
    // Let's just use string replacement line by line.
    
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("window.alert(")) {
             lines[i] = lines[i].replace(/window\.alert\((.*)\)/g, (match, p1) => {
                 if (isSuccess(p1)) return `toast.success(${p1})`;
                 return `toast.error(${p1})`;
             });
             modified = true;
        } else if (lines[i].includes("alert(")) {
             lines[i] = lines[i].replace(/alert\((.*)\)/g, (match, p1) => {
                 if (isSuccess(p1)) return `toast.success(${p1})`;
                 return `toast.error(${p1})`;
             });
             modified = true;
        }
    }
    
    if (modified) {
      // Find the correct import path for toast depending on depth
      // filepath is inside appDir
      // depth = relative path split by sep minus 1
      const relative = path.relative(path.dirname(filepath), path.join(appDir, "component", "Toast"));
      // relative might be "component/Toast" if in app, or "../component/Toast" if in app/admin, or "../../component/Toast" if in app/admin/something
      let importPath = relative.replace(/\\/g, '/');
      if (!importPath.startsWith('.')) {
          importPath = './' + importPath;
      }
      
      const importStatement = `import { toast } from "${importPath}";\n`;
      if (!content.includes('import { toast }')) {
          // insert after first import
          const firstImportIndex = lines.findIndex(l => l.startsWith('import'));
          if (firstImportIndex !== -1) {
              lines.splice(firstImportIndex, 0, importStatement.trim());
          } else {
              lines.unshift(importStatement.trim());
          }
      }
      
      fs.writeFileSync(filepath, lines.join('\n'), "utf8");
      console.log(`Updated ${filepath}`);
    }
  }
});
