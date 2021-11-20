import React, { Component } from 'react';
import { serializeSignDoc } from "@cosmjs/amino";
import { Secp256k1, Secp256k1Signature, sha256 } from "@cosmjs/crypto";
import { fromBase64 } from "@cosmjs/encoding";
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.checkForADR36Compliance = this.checkForADR36Compliance.bind(this);
  }
  signer = null;
  client = null;
  accounts = null;
  // I don't know why we use this chainId, but it's working
  chainId = "cosmoshub-4";

  state = {
    data: null,
    client: null,
    message: null,
    messageLink: null,
    keplrLoaded: false
  };

  componentDidMount() {
    this.callBackendAPI()
      .then(res => this.setState({ data: res.express }))
      .catch(err => console.log(err));
    window.addEventListener('load', this.handleLoad);
  }

  componentWillUnmount() {
    window.removeEventListener('load', this.handleLoad)
  }

  callBackendAPI = async () => {
    const response = await fetch('http://localhost:5000/starry-backend');
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  };

  handleLoad = async () => {
    if (!window.keplr) {
      this.setState({message: "Please install the Keplr extension"});
      this.setState({messageLink: {
          text: "Please install the Keplr extension",
          href: "https://www.keplr.app",
          target: "_blank"
        }});
      this.setState({keplrLoaded: false});
    } else {
      // Enabling before using the Keplr is recommended.
      // This method will ask the user whether or not to allow access if they haven't visited this website.
      // Also, it will request user to unlock the wallet if the wallet is locked.
      await window.keplr.enable(this.chainId);

      const offlineSigner = window.getOfflineSigner(this.chainId);
      this.signer = offlineSigner;

      // You can get the address/public keys by `getAccounts` method.
      // It can return the array of address/public key.
      this.accounts = await offlineSigner.getAccounts();

      // Ensure we have accounts from the Keplr wallet
      if (this.accounts === null) {
        this.setState({keplrLoaded: false});
        this.setState({message: 'Could not find accounts on Keplr wallet'});
      } else {
        this.setState({keplrLoaded: true});
      }
    }
  }

  signMessage = async () => {
    this.setState({message: 'Loading…'});
    const signDoc = {
      msgs: [{
        type: 'starry-login',
        value: 'my-unique-signing-message' // See the TODO in the backend about how we can fetch a unique Carl Sagan quote for them to sign and then double check that later on the backend after posting it there (currently not in this implementation)
      }],
      fee: {
        amount: [],
        // Note: this needs to be 0 gas to comply with ADR36, but Keplr current throws an error. See: https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-036-arbitrary-signature.md#decision
        gas: "1" },
      chain_id: this.chainId,
      memo: "You are powerful and capable, friend.",
      account_number: "0",
      sequence: "0",
    };

    try {
      const { signed, signature } = await this.signer.signAmino(this.accounts[0].address, signDoc);
      // TODO: here's where do we a post request to our backend, localhost:5000 with info
      //   we'll copy the code stuffs below
      const valid = await Secp256k1.verifySignature(
        Secp256k1Signature.fromFixedLength(fromBase64(signature.signature)),
        sha256(serializeSignDoc(signed)),
        this.accounts[0].pubkey,
      );
      console.log('valid', valid);
      // Clear the messages area
      this.setState({message: false});
    } catch (e) {
      if (e.message === 'Request rejected') {
        this.setState({message: 'Rejected signing 🙅'});
      } else {
        this.setState({message: `Unknown error 😬: ${e.message}`});
      }
    }
  }

  async checkForADR36Compliance(signed) {
    // Restrictions from ADR-036
    if (signed.memo !== "") throw new Error("Memo must be empty.");
    // Commented out the below since Keplr has error input.fee.error.unknown when gas is 0
    //   See: https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-036-arbitrary-signature.md#decision
    // if (signed.fee.gas !== "0") throw new Error("Fee gas must 0.");
    if (signed.fee.amount.length !== 0) throw new Error("Fee amount must be an empty array.");
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Bright and starry salutations</h1>
          <p className="App-subtitle">Let's get you logged in…</p>
          {this.state.message &&
            <div className="messages">{this.state.message}</div>
          }
          {this.state.messageLink &&
            <div className="messages-link"><a href={this.state.messageLink.href} target={this.state.messageLink.target}>{this.state.messageLink.text}</a></div>
          }
        </header>
        <div className="below-the-fold">
          <input type="submit" value="Sign-in with Keplr" onClick={this.signMessage.bind(this)} disabled={!this.state.keplrLoaded}/>
        </div>
        <p className="App-intro">{this.state.data}</p>
      </div>
    );
  }
}

export default App;
