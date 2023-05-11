import { css, Global } from "@emotion/react";

export const GlobalStylesheet = () => (
  <Global
    styles={css`
      body,
      html {
        height: 100vh;
        width: 100%;
        margin: 0;
        padding: 0;
        -ms-overflow-style: none;
        scrollbar-width: none;
        ::-webkit-scrollbar {
          display: none;
        }
      }

      body {
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #fff;
        background: #171c24;
        font-size: 14px;
      }

      ::-moz-focus-inner {
        border: 0;
      }

      * {
        box-sizing: border-box;
      }
      .select-box--container {
        height: 30px;
        border: 1px solid #aaa;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .select-box--box {
        width: 200px;
        position: absolute;
        left: 15px;
      }
      
      .select-box--selected-item {
        display: inline-block;
        height: 100%;
        width: 100%;
        padding: 4px 12px;
        vertical-align: middle;
      }
      
      .select-box--items div {
        border-bottom: 1px solid #ddd;
        border-left: 1px solid #ddd;
        border-right: 1px solid #ddd;
        padding: 6px;
        padding-left: 20px;
      }
      
      .select-box--arrow {
        width: 30px;
        height: 30px;
        margin: 0;
        padding: 0;
        display: inline-block;
        background: #aaaaaa;
        position: absolute;
        right: 0;
        top: 0;
      }
      
      .select-box--arrow-down {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid red;
      }
      
      .select-box--arrow-up {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 10px solid red;
      }
      
    `}
  />
);

export default GlobalStylesheet;
