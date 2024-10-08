const path = require("path");

module.exports = {
  lintOnSave: false,
  configureWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      // 仅在生产环境下设置库模式
      config.output = {
        ...config.output,
        libraryExport: 'default'
      }
    }
  },
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      // 仅在生产环境下修改构建配置
      config.entryPoints.clear()
      config.entry('fcanvas').add('./src/fcanvas/canvas.js')
      config.output
        .filename('fcanvas.js')
        .libraryTarget('umd')
        .library('fcanvas')

      // // 添加自定义 HTML 模板
      // config.plugin('html').tap(args => {
      //   args[0].template = path.resolve(__dirname, 'public/custom-template.html');
      //   args[0].filename = 'demo.html';
      //   args[0].inject = false; // 防止自动注入 JS 和 CSS
      //   return args;
      // })
    }
  
  },
  css: { 
    extract: process.env.NODE_ENV === 'production' ? false : true 
  },
  productionSourceMap: false,
}