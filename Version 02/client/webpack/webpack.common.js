const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const CURRENT_WORKING_DIR = process.cwd();

module.exports = {
  entry: [path.join(CURRENT_WORKING_DIR, 'app/index.js')],
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.css', '.scss', '.html'],
    alias: {
      app: path.resolve(CURRENT_WORKING_DIR, 'app')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: ['@babel/plugin-proposal-class-properties']
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: {
            ignore: ['**/index.html']
          }
        }
      ]
    })
  ]
};