<template>
  <div id="app">
    <keep-alive  >
      <router-view />
    </keep-alive>
  </div>
</template>

<script>


export default {
  name: 'app',
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 10px 200px;
}

body {
  margin: 10px;
}

.nav {
  margin: 10px;

}

.nav a {
  padding: 10px;
  font-size: 17px;
}

.margining {
  margin: 10px;
  font-size: 18px;
}

.input-btns {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 10px;
}

.row-center {
  display: flex;
  margin-top: 4px;
  flex-direction: row;
  justify-content: center;
}

.content {
  padding-top: 10px;
  padding-left: 14px;
  padding-right: 14px;
  margin: 8px;
}

.content-on-tab {
  margin-bottom: 100px;
}

.plain {
  color: #409EFF;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.gold-font {
  color: #303133;
  font-weight: bold;
}

.card-bkg {
  padding: 11px;
  border-radius: 4px;
  /* background: #f5e8c5; */
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
}

.gold-border {
  border: 2px solid #DCDFE6;
  border-radius: 5px;
}

.el-message-box__wrapper .el-message-box {
  width: 340px;
}


.el-slider__button-wrapper .el-slider__button {
  border: 2px solid #F8C200;
}

.el-slider__runway .el-slider__bar {
  background-color: #F8C200;
}

.header {
  height: 45px;
  font-weight: bolder;
  display: flex;
  align-items: center;
  background-color: #F8C200;
  /*指定垂直居中*/
}

.header-title {
  margin: 0 auto;
}

.back {
  padding: 14px;
}

.title {
  text-align: left;
  margin-top: 17px;
  margin-bottom: 15px;
  font-size: 15px;
  display: flex;
  align-items: center;
}

.title img {
  height: 19px;
  width: 19px;
}

.title span {
  margin-left: 6px;
}

</style>
