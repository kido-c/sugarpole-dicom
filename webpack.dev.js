import { merge } from "webpack-merge";
import common from "./webpack.common.js";

export default merge(common, {
  mode: "development",
  devtool: "eval", // 최대 성능을 갖춘 개발 빌드에 권장되는 선택입니다.
  devServer: {
    historyApiFallback: true, // 모든 경로에 대해 index.html을 반환하도록, SPA내부에서 잘못된 요청을 처리하도록
    port: 3000, // localhost:3000
    hot: true, // hot module 교체 ( 새로 고침 없이 업데이트 )
  },
});
