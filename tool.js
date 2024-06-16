const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');

// 解析対象のディレクトリを指定してください
const targetDir = path.resolve(__dirname, '../ruby-on-rails-react/frontend/src');

// ファイルの依存関係を解析する関数
const analyzeDependencies = async (files) => {
    const dependencies = {};

    for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const regex = /import\s+(?:[\w*{}\s,]*\s+from\s+)?['"](.*)['"];?/g;
        let match;
        const imports = [];

        console.log(`Analyzing file: ${file}`);

        while ((match = regex.exec(content)) !== null) {
            const importPath = match[1];
            console.log(`Found import: ${importPath} in ${file}`);

            if (importPath.startsWith('.')) {
                const absoluteImportPath = path.resolve(path.dirname(file), importPath);
                console.log(`Resolved absolute import path: ${absoluteImportPath}`);
                const extensions = ['.tsx', '.ts', '.js', '.jsx'];
                let resolvedPath = null;

                for (const ext of extensions) {
                    if (fs.existsSync(absoluteImportPath + ext)) {
                        resolvedPath = absoluteImportPath + ext;
                        console.log(`Resolved path with extension: ${resolvedPath}`);
                        break;
                    }
                }
                if (resolvedPath) {
                    imports.push(path.relative(targetDir, resolvedPath));
                } else {
                    imports.push(importPath); // 解決できない相対パスも含める
                    console.warn(`Could not resolve path for import: ${importPath} in ${file}`);
                }
            } else {
                imports.push(importPath); // 外部モジュールはそのまま
                console.log(`External module: ${importPath}`);
            }
        }

        dependencies[path.relative(targetDir, file)] = imports;
        console.log(`Dependencies for ${file}: ${JSON.stringify(imports)}`);
    }

    return dependencies;
};

// 依存関係を逆転させる関数
const invertDependencies = (dependencies) => {
    const inverted = {};

    Object.keys(dependencies).forEach((file) => {
        dependencies[file].forEach((dependency) => {
            if (!inverted[dependency]) {
                inverted[dependency] = [];
            }
            if (!inverted[dependency].includes(file)) {
                inverted[dependency].push(file);
            }
        });
    });

    return inverted;
};

// 非同期でファイルを検索して依存関係を解析
const main = async () => {
    console.log('hello');

    try {
        const files = await fg(`${targetDir}/**/*.{tsx,ts}`);
        console.log('Files found:', files.length);
        console.log('Analyzing dependencies...', targetDir);

        const dependencies = await analyzeDependencies(files);
        const invertedDependencies = invertDependencies(dependencies);

        // 通常の依存関係をJSON形式で出力
        await fs.writeJson('dependencies.json', dependencies, { spaces: 2 });
        console.log('Dependencies written to dependencies.json');

        // 逆転させた依存関係をJSON形式で出力
        await fs.writeJson('inverted_dependencies.json', invertedDependencies, { spaces: 2 });
        console.log('Inverted dependencies written to inverted_dependencies.json');
    } catch (err) {
        console.error('Error finding files:', err);
    }
};

main();
