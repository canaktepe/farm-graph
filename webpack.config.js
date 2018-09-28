// var webpack = require('webpack');

// module.exports = {
//   plugins: [
//     new webpack.ProvidePlugin({
//       jQuery: 'jquery',
//       $: 'jquery'
//     }),
//     new webpack.ProvidePlugin({
//       ko: 'knockout',
//     }),
//   ],
//   module: {
//     rules: [
//       {
//         test: /\.css$/,
//         use: [ 'style-loader', 'css-loader' ]
//       }
//     ]
//   }
// };


const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './assets/js/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery'
    }),
    new webpack.ProvidePlugin({
      ko: 'knockout',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};