const fs = require('fs');

// 依存関係JSONファイルの読み込み
const dependencies = JSON.parse(fs.readFileSync('./dependencies.json', 'utf-8'));
const invertedDependencies = JSON.parse(fs.readFileSync('./inverted_dependencies.json', 'utf-8'));

// 異なるディレクトリ間での依存関係をフィルタリングする関数
const filterCrossDirectoryDependencies = (dependencies) => {
  const crossDirectoryDeps = {};

  for (const [file, deps] of Object.entries(dependencies)) {
    const fileDir = file.split('/')[1]; // ファイルのディレクトリを取得（例: "onePage", "twoPage"）
    for (const dep of deps) {
      const depDir = dep.split('/')[1]; // 依存ファイルのディレクトリを取得
      if (fileDir && depDir && fileDir !== depDir) {
        if (!crossDirectoryDeps[file]) {
          crossDirectoryDeps[file] = [];
        }
        crossDirectoryDeps[file].push(dep);
      }
    }
  }

  return crossDirectoryDeps;
};

// フィルタリングされた依存関係を取得
const crossDirectoryDependencies = filterCrossDirectoryDependencies(dependencies);
fs.writeFileSync('cross_directory_dependencies.json', JSON.stringify(crossDirectoryDependencies, null, 2));
console.log('Cross-directory dependencies written to cross_directory_dependencies.json');
