import { execSync } from 'child_process';

try {
    // Use sass CLI to compile and check for errors
    const result = execSync('npx sass docs/.vuepress/styles/index.scss --no-source-map --style=compressed', {
        cwd: 'e:\\Dev\\blog',
        encoding: 'utf-8',
        timeout: 30000
    });
    console.log('SCSS compiles successfully!');
    console.log('Output size:', result.length, 'chars');
} catch (e) {
    console.error('SCSS COMPILATION ERROR:');
    console.error(e.stderr || e.message);
}
