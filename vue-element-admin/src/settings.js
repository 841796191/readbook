module.exports = {
  title: '读书管理',

  /**
   * @type {boolean} true | false
   * @description Whether show the settings right-panel
   *  是否显示右侧悬浮配置按钮
   */
  showSettings: false,

  /**
   * @type {boolean} true | false
   * @description Whether need tagsView
   *  是否显示页面标签功能条
   */
  tagsView: true,

  /**
   * @type {boolean} true | false
   * @description Whether fix the header
   *  是否将头部布局固定
   */
  fixedHeader: false,

  /**
   * @type {boolean} true | false
   * @description Whether show the logo in sidebar
   *  菜单栏是否显示LOGO
   */
  sidebarLogo: false,

  /**
   * @type {string | array} 'production' | ['production', 'development']
   * @description Need show err logs component.
   * The default is only used in the production env
   * If you want to also use it in dev, you can pass ['production', 'development']
   *  默认显示错误日志的环境
   */
  errorLog: 'production'
}
