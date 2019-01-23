import React, { Component } from "react";
import Marketplace from "./contracts/Marketplace.json";
import getWeb3 from "./utils/getWeb3";
//import getIpfs from "./utils/getIpfsClient";
import truffleContract from "truffle-contract";
import Index from './pages/index';
import {Actions} from './store/model'
import {connect} from 'react-redux';
import {Translator} from './utils/translator';
import ipfsClient from "ipfs-http-client";

import "./App.css";

class App extends Component {
  state = { userStatus: -1, web3: null, accounts: null, contract: null };

  constructor(props) {
    super(props)
    this.componentDidMount();
  }

  componentDidMount = async () => {
    try {
      const {ipfsLoaded} = this.props;
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      //const ipfs = await getIpfs();
      //console.log(ipfs);
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(Marketplace);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.intialize);
      this.props.contractLoaded(instance);
      this.props.accountsLoaded(accounts);

      // load IPFS client
      var ipfs = ipfsClient('localhost', '5001', { protocol: 'http' });
      ipfs.swarm.peers(function (err) {
        if (err) {
          ipfsLoaded(false);
          console.log("IPFS daemon not found. File upload will be disabled: ", err); 
        } else {
          ipfsLoaded(ipfs);
        }
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  intialize = async () => {
    const { contract, accounts } = this.state;

    const userStatusResponse = await contract.getUserStatus.call(accounts[0], { from: accounts[0] });
    this.setState({ userStatus: userStatusResponse.toNumber() });
    this.props.userStatusUpdated(Translator.convertUserStatusCode(userStatusResponse.toNumber()));
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (<Index userStatus={this.state.userStatus} />);
  }
}

const mapStateToProps = (state) => {
  return {
    userStatus: state.userStatus,
    contract: state.contract,
    accounts: state.accounts
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    userStatusUpdated(userStatus){dispatch(Actions.userStatusUpdated(userStatus))},
    storefrontsFetched(storefronts){dispatch(Actions.storefrontsFetched(storefronts))},
    contractLoaded(contract){dispatch(Actions.contractLoaded(contract))},
    accountsLoaded(accounts){dispatch(Actions.accountsLoaded(accounts))},
    ipfsLoaded(ipfs){dispatch(Actions.ipfsLoaded(ipfs))}
  }
}

export default connect(
mapStateToProps,
mapDispatchToProps
)(App)