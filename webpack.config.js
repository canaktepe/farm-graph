const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copyHTMLFiles = new CopyWebpackPlugin([
  {
    from: './forms/*.html',
    to: "../"
  },
  {
    from : './assets/devices.json',
    to: "../"
  }
]);

const jqueryPlugin = new webpack.ProvidePlugin({
  jQuery: "jquery",
  $fg: "jquery"
});

const knockoutPlugin = new webpack.ProvidePlugin({
  ko: "knockout"
});

module.exports = env => {
  const FORMS_PATH = env ? env.production ? '/farm_graph/forms/' : '/forms/' : '/forms/';
  const DEVICES_PATH = env ? env.production ? '/farm_graph/devices.json' : '/assets/devices.json' : '/assets/devices.json';
  return {
    entry: "./assets/js/app.js",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist/assets")
    },
    plugins: [
      jqueryPlugin,
      knockoutPlugin,
      copyHTMLFiles,
      new webpack.DefinePlugin({
        'process.env': {
          'FORMS_PATH': JSON.stringify(FORMS_PATH),
          'DEVICES_PATH': JSON.stringify(DEVICES_PATH)
        }
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
                name: "[name].[ext]"
              },
            },
            {
              loader: "extract-loader"
            },
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                minimize: true
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
  }
};
