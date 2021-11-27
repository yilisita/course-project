/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to issue commercial paper
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { Wallets, Gateway } = require('fabric-network');
const {buildCAClient, registerAndEnrollUser, enrollAdmin} = require('./CAUtil.js');

// 通道名
const channel = "mychannel";
// 链码名
const chaincode = "private";

//----初始化组织2----
async function initOrg2(username){


    try{
        // load the network configuration for org2
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../../../test-network/organizations/peerOrganizations/org2.example.com/connection-org2.yaml', 'utf8'));


        // Create a new CA client for interacting with the CA.
        const caInfo = connectionProfile.certificateAuthorities['ca.org2.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '../identity/org2/wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // enroll an admin
        await enrollAdmin(ca, wallet, 'Org2MSP');

        // register and enroll a user
        await registerAndEnrollUser(ca, wallet, 'Org2MSP', username, 'org2.department1');

        // console.log('Successfully enrolled client user', username, 'and imported it into the wallet');
        // 新建gateway
        const gateway = new Gateway();
        // 利用配置文件连接到gateway
        await gateway.connect(connectionProfile,
            {wallet: wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});
        
        const network = await gateway.getNetwork(channel);
        const contract = await network.getContract(chaincode);
        contract.addDiscoveryInterest({ name: chaincode, collectionNames: ["Org2PrivateCollection"] });
        return contract;
    }catch(error){
        console.error(error);
    }

}

async function sendRequest(contract, proposal, requestID){

    try{
        const time = Date().toLocaleString();
        await contract.submitTransaction("SendRequest", requestID, proposal.toString(), time);
        return "您的查询请求: " + proposal.toString() + " 已经发送成功";
    }catch(error){
        return error;
    }
}

async function readResponse(contract){
    try{
        var res = await contract.evaluateTransaction("GetAllResponses");
        return res.toString();
    }catch(error){
        return error;
    }
}


module.exports = {
    initOrg2,
    sendRequest,
    readResponse,
}
