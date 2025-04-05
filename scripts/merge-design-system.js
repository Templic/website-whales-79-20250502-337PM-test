
import fs from 'fs';
import path from 'path';

const DESIGN_SYSTEM_PATH = 'client/src/components/features/design-system';
const COMPONENT_GROUPS = {
  layout: ['Container', 'Grid', 'Stack'],
  navigation: ['Menu', 'Breadcrumbs', 'Tabs'],
  feedback: ['Alert', 'Toast', 'Progress'],
  forms: ['Input', 'Select', 'Checkbox']
};

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createComponentIndexFile(groupPath, components) {
  const exports = components.map(comp => `export * from './${comp}';`).join('\n');
  fs.writeFileSync(path.join(groupPath, 'index.ts'), exports);
}

function main() {
  ensureDirectoryExists(DESIGN_SYSTEM_PATH);
  
  Object.entries(COMPONENT_GROUPS).forEach(([group, components]) => {
    const groupPath = path.join(DESIGN_SYSTEM_PATH, group);
    ensureDirectoryExists(groupPath);
    createComponentIndexFile(groupPath, components);
  });
}

main();
