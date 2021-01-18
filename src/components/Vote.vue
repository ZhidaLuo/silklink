<template>
<div>
  <h1> 治理 DEMO </h1>

  <el-card>
    <h3>协议基本信息</h3>
    <p> 当前费率: {{ ownAddr }} </p>
    <p> 由 {{ ownAddr }} 治理</p>
  </el-card>


  <h3>委托投票</h3>
  我的票数：{{ myVotes }}， 当前委托给：{{ myDelegator }}

  <div class="row-center">
    <el-input v-model="delegateTo" placeholder="投票权委托给（输入地址）" ></el-input>
    <el-button @click="delegate">委托投票权</el-button>
  </div>


  <h3>提案</h3>
  <div >
      <el-select @change="actionChanged" v-model="proposeAction"  placeholder="请选择提案类型">
        <el-option v-for="(ptype) in typeList" :key="ptype.signature" :label="ptype.label" :value="ptype.signature">
        </el-option>
      </el-select>
      <div class="row-center">
      <el-input v-model="proposeParam1" :placeholder="proposeHint1" ></el-input>
      <el-input v-if="hasParam2" v-model="proposeParam2" :placeholder="proposeHint2" ></el-input>
      </div>
      <el-input v-model="propseDesc"  type="textarea" placeholder="提案简单描述，如果提案的描述很长，可以用 github 管理，类似以太坊EIP提案">

      </el-input>

      <el-button @click="propose">发起提案</el-button>
  </div>

    <h3>提案列表</h3>

    <el-card v-for="(propose , id) in proposeList" :key="id" >
      <div > 提案编号：{{  id }} , 投票截止于：{{  propose.endTime }} (为了测试方便，投票期为一天)</div> 
      <div > 提案人：{{  propose.proposer }}</div> 
      <div > {{  propose.label }} : {{ propose.data }} </div> 
      <div> 提案描述: {{  propose.desc }} </div> 
      
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


export default {
  name: 'HOME',
  data() {
    return {
      account: null,
      link: null,
      novaDaoAddr: null,
      
      fundEth: null,
      members: null,
      feeReceiver: null,
      feeBalance: null,
      govByDao: false,
      ownAddr: null,

      joinNeedFund: null,

      delegateTo: null,
      myDelegator: null,
      myVotes: null,

      memberArray: null,
      proposeAction: null,
      proposeHint1: null,
      proposeHint2: null,
      proposeParam1: null,
      proposeParam2: null,
      hasParam2 : false,
      propseDesc: null,

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
      this.nova = await Proxy.getNova()
      this.governor = await Proxy.getGovernor()
      this.novaDao =  await Proxy.getNovaDao()

      this.novaDaoAddr = this.novaDao.address;

      this.link = "https://goerli.etherscan.io/token/" + this.novaDao.address

      this.totalSupply();
      this.feeReceiverInfo();

      this.getPriorVotes(this.account)
      this.owner();
      this.getProposes();
    },

    async ethBalance(addr) {
      let bs = await this.web3.eth.getBalance(addr);
      return this.web3.utils.fromWei(bs.toString());
    },

    owner() {
      this.novaDao.owner().then(r => {
        this.ownAddr = r;
        if(r == this.governor.address) {
          this.govByDao = true;
        }
      })
    },

    totalSupply() {
      this.nova.totalSupply().then(r => {
        this.members = r.toNumber()
        this.joinFundInfo();
      })

      this.ethBalance(this.novaDaoAddr).then((b) => {
        this.fundEth = b;
      })
    },

    joinFundInfo() {
      this.novaDao.joinFundInfo().then(r => {
        if (this.members < INIT_MEMBER_COUNT) {

          this.joinNeedFund = this.web3.utils.fromWei(r[0]);
        } else {
          this.joinNeedFund = parseInt(this.web3.utils.fromWei(r[0])) + parseInt(this.web3.utils.fromWei(r[1]));
        }
      })
    },

    transferOwn() {
      try {
        this.novaDao.transferOwnership("0x0B25233AB8E591Ce55b5C7437bcf00B79D0Cc83a", {from: this.account}).then(
          r => {
            this.owner();
          }
        )
      } catch(e) {
        console.log("transferOwnerToGov error:" + e)
      }
    },

    // async transferOwn() {
    //   try {
    //     this.novaDao.transferOwnership(this.governor.address, {from: this.account}).then(
    //       r => {
    //         this.owner();
    //       }
    //     )
    //   } catch(e) {
    //     console.log("transferOwnerToGov error:" + e)
    //   }
    // },

    async getProposes() {
      let num = await this.governor.proposalCount();
      for (let i = num.toNumber(); i > 0; i--) {
        await this.getPropose(i);
      }
    },

    async rageQuit() {
      this.novaDao.rageQuit(this.account, {from: this.account}).then(() => {
        this.totalSupply();
        this.getPriorVotes(this.account)
      })
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

      if (action.signatures[0] == "addCandidate(address)") {
        let candidater = this.web3.eth.abi.decodeParameter('address', action.calldatas[0])
        data = candidater;

        if (state.toNumber()  == 5) {
          await this.candidates(id, candidater);
        }

      } else if (action.signatures[0] == "withdraw(address,uint256)") {
        let datas = this.web3.eth.abi.decodeParameters(['address', 'uint256'], action.calldatas[0]);
        data = '提取到:' + datas[0] + ', 金额:' +  this.web3.utils.fromWei(datas[1]) + " ETH";
      }

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

    async getPriorVotes(user) {
      try {
        let bn = await this.web3.eth.getBlockNumber()
        this.myVotes = await this.nova.getPriorVotes(user, bn-1);

        this.myDelegator =  await this.nova.delegates(user);

      } catch(e) {
        console.log("getPriorVotes error:" + e)
      }
    },

    async delegate() {
      this.nova.delegate(this.delegateTo).then(() => {
        this.getPriorVotes(this.account);
      })
    },

    feeReceiverInfo() {
      this.novaDao.feeReceiver().then(r => {
        this.feeReceiver = r
        return this.ethBalance(r);
      }).then(r => {
        this.feeBalance = r;
      })
    },

    initMembers() {
      let users =  this.memberArray.split(',');
      let ethValue = this.joinNeedFund * users.length;
      console.log("need ethValue:" + ethValue);
      this.novaDao.initMembers(users, {from: this.account, value: this.web3.utils.toWei("" + ethValue) }).then(() => {
        this.totalSupply();
      })
    },

    actionChanged() {
      console.log("select:" + this.proposeAction);
      if (this.proposeAction == "addCandidate(address)") {
        this.hasParam2 = false;
        this.proposeHint1 = "输入候选人地址"
      } else {
        this.hasParam2 = true;
        this.proposeHint1 = "提取目标地址"
        this.proposeHint2 = "提取金额"
      }
      
    },

    propose() {
      if (!govByDao) {
        this.$message('还没有开启投票，初始化完成后，请把管理员转移到治理合约。');
        return ;
      }

      if (!this.propseDesc) {
        this.$message('请输入提案描述');
        return ;
      }
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

    joinMember(id, user) {
      let value = this.web3.utils.toWei(this.joinNeedFund);
      this.novaDao.joinMember(user, {from: this.account, value: value}).then(() => {
        this.getPropose(id);
      })
    },

    candidates(id, user) {
      this.novaDao.candidates(user, {from: this.account}).then((r) => {
        console.log("r:" + r)
        this.proposeList[id].pendingJoin = r;
        this.$forceUpdate();
      })
    },


  }
}
</script>

<style scoped>
.input-btns {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: 10px;
}
</style>
