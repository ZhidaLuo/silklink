<template>
<div>
  <h1> 治理 DEMO - 质押治理</h1>
  <Header></Header>

  <el-card>
    <p>合约地址： {{ contractAddr }} </p>
    <p> 我的质押量: {{ stakedAmount }} </p>
    <div class="row-center">
      <el-input v-model="stakeAmount" placeholder="输入质押量" ></el-input>
      <el-button @click="approve">授权</el-button>
      <el-button @click="stake">质押</el-button>
    </div>
    
    <h3>提案</h3>
    <div class="row-center">
      <el-input v-model="target" :placeholder="执行目标" ></el-input>
      <el-input v-model="signature" :placeholder="执行函数" ></el-input>
      <el-input  v-model="calldata" :placeholder="参数" ></el-input>
      <el-button @click="propose">提案</el-button>
    </div>


  <h3>提案列表</h3>

    <div v-for="(propose , id) in proposeList" :key="id" >
      <div > 提案编号：{{  id }} , 投票截止于：{{  propose.endTime }} (为了测试方便，投票期为一天)</div> 
      <div > {{  propose.label }} : {{ propose.data }} </div> 
      
      <div> 提案状态: <b>{{  proposalState[propose.state] }}</b> <el-button v-if="propose.state==3" @click="execute(id)">执行</el-button> </div> 
      <div> 投票数据:  {{  propose.forVotes }} 赞成票, {{  propose.againstVotes }} 反对票 </div> 
      <div> 我的投票：{{  propose.myVotes }} 
        <label v-if="propose.myVotes > 0 && propose.support">赞成票</label>
        <label v-if="propose.myVotes > 0 && !propose.support">反对票</label>
        <div v-if="propose.myVotes == 0">
          <el-button @click="voteFor(id)">赞成</el-button>
          <el-button @click="voteAgainst(id)">反对</el-button>
        </div>
      </div> 
    </div>
  </el-card>

</div>
</template>

<script>
/* eslint-disable */
import {
  formatNum,
  toDec,
  fromDec
} from "./../decUtil";
import Proxy from "./../proxy.js";

import Header from "./Header.vue";


export default {
  name: 'HOME',
  data() {
    return {
      account: null,
      contractAddr: null,
      stakedAmount: null,
      stakeAmount: null,

      proposalState: ["等待投票", "投票中", "失败", "成功", "过期", "已执行"],
      actionMap: {
          "addCandidate(address)": "推荐候选人",
          "withdraw(address,uint256)": "提取资金"
        },

      typeList: [
        {
          label: "推荐候选人",
          signature: "addCandidate(address)"
        },
        {
          label: "提取资金",
          signature: "withdraw(address,uint256)"
        }
      ],

      proposeList: {}
    }
  },

  components: {
    'Header': Header
  },

  created() {
    Proxy.initWeb3Account((web3, acc) => {
      console.log("my account address:" + acc)
      this.account = acc
      this.web3 = web3
      this.init()
    });
  },

  methods: {
    async init() {
      this.token = await Proxy.getMyERC20();
      this.protocol = await Proxy.getProtocol();
      this.governor = await Proxy.getVoteByStake();
    },

    async getProposes() {
      let num = await this.governor.proposalCount();
      for (let i = num.toNumber(); i > 0; i--) {
        await this.getPropose(i);
      }
    },

    async getPropose(id) {
      console.log("propose ID:" + id)
      let proposeInfo = await this.governor.proposals(id);
      let action = await this.governor.getActions(id);
      let state = await this.governor.state(id);
      let myReceipt = await this.governor.getReceipt(id, this.account)
      console.log(action.signatures[0])
      let endTime = new Date(proposeInfo.endTs * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ')
      let data;


      this.proposeList[proposeInfo.id] = {
        action: action.signatures[0], 
        label: this.actionMap[action.signatures[0]],
        desc: proposeInfo.desc,
        state: state.toNumber(),
        proposer: proposeInfo.proposer,
        data: data,
        forVotes: proposeInfo.forVotes,
        againstVotes: proposeInfo.againstVotes,
        endTime: endTime,
        myVotes: myReceipt.votes,
        support: myReceipt.support,
      }

      this.$forceUpdate();
    },


    propose() {

      if (this.proposeAction == "addCandidate(address)") {
        if (this.web3.utils.isAddress(this.proposeParam1)) {
          let userBytes = this.web3.eth.abi.encodeParameter("address", this.proposeParam1);
          this.commitPropose(this.novaDao.address, 0, this.proposeAction, userBytes, this.propseDesc)
        } else {
          this.$message('无效的候选人地址');
        }

      } else if (this.proposeAction == "withdraw(address,uint256)") {

        if (this.web3.utils.isAddress(this.proposeParam1) && parseFloat(this.proposeParam2) > 0) {
          let data = web3.eth.abi.encodeParameters(['address','uint256'], [user, amount]);
          this.commitPropose(this.novaDao.address, 0, this.proposeAction, data, this.propseDesc)
        } else {
          this.$message('无效的收款地址');
        }
      }
    },

    commitPropose(target, value, signature, calldata, desc) {
      this.governor.propose([],[value], [signature], [calldata], desc, {from: this.account}).then(() => {
        return this.governor.proposalCount();
      }).then(id => {
        this.getPropose(id)

      })
    },

    execute(id) {
      this.governor.execute(id, {from: this.account}).then(() => {
        this.getPropose(id);
      })
    },

    voteFor(id) {
      this.governor.castVote(id, true, {from: this.account}).then(() => {
        this.getPropose(id);
      })
    },

    voteAgainst(id) {
      this.governor.castVote(id, false, {from: this.account}).then(() => {
        this.getPropose(id);
      })
    },


  }
}
</script>
