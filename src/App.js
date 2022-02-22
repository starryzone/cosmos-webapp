import React, { Component } from 'react';
import './App.css';

const prefixToChainId = {
  juno: 'juno-1',
  stars: 'stargaze-1'
}

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
    data: {
      createdAt: null,
      saganism: null,
      other: null
    },
    client: null,
    message: '',
    messageLink: null,
    keplrLoaded: false,
    retrievedSaganism: false,
    hasTravellerToken: false,
    messageToSign: null,
    finished: false
  };

  componentDidMount() {
    window.addEventListener('load', this.handleLoad);
    const traveller = this.getTraveller()
    if (traveller === null) {
      this.setState({'message': "Can you check your Discord link again?\nWe were expecting details about your uniqueness, traveller."})
    } else {
      this.setState({hasTravellerToken: true})
      this.callBackendAPI()
        .then(res => {
          this.setState({ data: res })
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('load', this.handleLoad)
  }

  callBackendAPI = async () => {
    const travellerSessionToken = this.getTraveller()
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traveller: travellerSessionToken })
    };
    console.log('backend URL', this.props.backendURL);
    const response = await fetch(`${this.props.backendURL}/starry-backend`, requestOptions);
    if (response.status !== 200) {
      this.setState({ retrievedSaganism: false })
      return {other: `Couldn't find your info, my dear traveller with passport '${travellerSessionToken}'.`};
    } else {
      this.setState({ retrievedSaganism: true })
    }
    const body = await response.json();
    if (body.saganism) {
      this.setState({ messageToSign: body.saganism })
    }

    if (body.hasOwnProperty('nativeToken') && body.nativeToken) {
      const prefixes = Object.keys(prefixToChainId)
      if (prefixes.includes(body.nativeToken)) {
        this.chainId = prefixToChainId[body.nativeToken]
        await this.handleLoad()
      } else {
        console.warn('Did not understand the prefix', body.nativeToken)
      }
    }

    return body;
  };

  getTraveller() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('traveller');
  }

  handleLoad = async () => {
    if (!window.keplr) {
      this.setState({message: "Could not find Keplr browser extension"});
      this.setState({messageLink: {
          text: "Please install the Keplr extension",
          href: "https://www.keplr.app",
          target: "_blank"
        }});
      this.setState({keplrLoaded: false});
    } else {
      console.log()
      // Thank you jhernandez for the tip
      window.keplr.defaultOptions = {
        sign: {
          preferNoSetFee: true,
        },
      };
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
      } else if (this.accounts && this.state.hasTravellerToken) {
        this.setState({keplrLoaded: true});
      }
    }
  }

  signMessage = async () => {
    this.setState({message: 'Loading…'});
    const signDoc = {
      msgs: [{
        type: 'starry-login',
        value: this.state.messageToSign
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
      const travellerSessionToken = this.getTraveller()

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traveller: travellerSessionToken,
          signed: signed,
          signature: signature.signature,
          account: this.accounts[0]
        })
      };
      const response = await fetch(`${this.props.backendURL}/keplr-signed`, requestOptions);
      if (response.status !== 200) {
        this.setState({message: 'Signature messed up.'});
        return {other: `Couldn't verify your signed message, star gazer.`};
      }
      // Successful
      this.setState({ message: 'Success!\nYou may return to Discord and see the channels you\'ve unlocked.'});
      this.setState({ finished: true, retrievedSaganism: false });
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
    const frontendMessages = this.state.message.split('\n').map(i => {
      return <p key={i}>{i}</p>
    });

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Bright and starry salutations</h1>
          <p className="App-subtitle">Let's get you logged in…</p>
          {this.state.message &&
            <div className="messages">
              {frontendMessages}
              {this.state.messageLink &&
                <div className="messages-link"><a href={this.state.messageLink.href} target={this.state.messageLink.target}>{this.state.messageLink.text}</a></div>
              }
            </div>
          }
        </header>
        <div className="below-the-fold">
          <input type="submit" value="Sign-in with Keplr" onClick={this.signMessage.bind(this)} disabled={!this.state.keplrLoaded || !this.state.retrievedSaganism}/>
        </div>
        { (this.state.data.saganism && this.state.retrievedSaganism && this.state.keplrLoaded && !this.state.finished) ?
          <p className="App-intro">You're all set. Go ahead and sign, cosmonaut.</p>
          :
          <p className="App-intro">{this.state.data.other}</p>
        }
      </div>
    );
  }
}

export default App;
