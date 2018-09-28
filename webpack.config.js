const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./assets/js/app.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new webpack.ProvidePlugin({
      jQuery: "jquery",
      $: "jquery"
    }),
    new webpack.ProvidePlugin({
      ko: "knockout"
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        loaders: [
          {
            loader: "file-loader",
            options: {
                name: "[name].[ext]",
            },
          },
          {
            loader: "extract-loader"
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  }
};
