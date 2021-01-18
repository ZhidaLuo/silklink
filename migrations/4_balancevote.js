var MyERC20 = artifacts.require("MyERC20");
var VoteByBalance = artifacts.require("VoteByBalance");


module.exports = async function(deployer) {
  let token = await MyERC20.deployed();
  return deployer.deploy(VoteByBalance, token.address);
}


