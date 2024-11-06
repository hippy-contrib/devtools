const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const banner = pkg.name + ' v' + pkg.version + ' ' + pkg.homepage;

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'VanillaJSDevtools',
    globalObject: '(0, eval)("this")',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
      },
    ],
  },
  externals: {
    // '@hippy/vue': {
    //   commonjs: '@hippy/vue',
    //   commonjs2: '@hippy/vue',
    //   amd: '@hippy/vue',
    //   root: 'Vue'
    // },
    // '@hippy/react': {
    //   commonjs: '@hippy/react',
    //   commonjs2: '@hippy/react',
    //   amd: '@hippy/react',
    //   root: 'React'
    // },
  },
  plugins: ([
    new webpack.BannerPlugin(banner),
    new webpack.DefinePlugin({
      __resourceQuery: '__resourceQuery',
      window: 'global',
    }),
    process.env.NODE_ENV === 'stat' && new BundleAnalyzerPlugin()
  ]).filter(Boolean),
};
