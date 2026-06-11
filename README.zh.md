[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

# BookRoll PDF 下载器

一个 Chrome 扩展，可自动抓取 [BookRoll](https://www.let.media.kyoto-u.ac.jp/project/digital-teaching-material-delivery-system-bookroll/) 电子教材的所有页面，并保存为单个 PDF 文件。

## 安装方法

1. 下载并解压本仓库
2. 在 Chrome 地址栏输入 `chrome://extensions` 并回车
3. 打开右上角的**开发者模式**开关
4. 点击**加载已解压的扩展程序**，选择解压后的文件夹
5. 工具栏中会出现扩展图标

## 使用方法

1. 用 Chrome 打开 BookRoll 教材页面
2. 点击工具栏中的扩展图标
3. 点击 **Scan Pages**，扩展会自动翻页并逐页抓取
4. 扫描完成后点击 **Download PDF**

## 注意事项

- 扫描过程中请勿操作页面
- 适用于以 `material-canvas` 元素渲染页面的 BookRoll 版本
- 仅供个人学习使用，请遵守所在学校的使用规定及版权规则

## 工作原理

扩展读取每页的 `canvas.material-canvas` 元素内容，通过比对画布像素特征来判断翻页，最后将所有帧直接组装成 PDF 二进制文件——无需任何外部依赖库。
