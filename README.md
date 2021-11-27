# Keplr signing ADR36

This repo will be used to facilitate a Discord bot but can be helpful for anyone wanting to use the [Keplr wallet](https://www.keplr.app) to sign arbitrary messages and verify the signed document and public key.

There is a standard called [ADR36 for signed typed messages](https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-036-arbitrary-signature.md), and we'll get as close as we can to using this standard, except when the Keplr wallet limitation exist.

## Using this repo

There is a server (ExpressJS) and a React frontend that communicate. This document is for the frontend.

Good idea to have NodeJS version >= `v14.17.0`

Let's also get `yarn` with:

    npm i -g yarn

First we install with:

    yarn

    npm run start

This will give you instructions in your Terminal or Command Prompt app.

## What's happening

We are using the Keplr to sign a message using the private key stored in the wallet. This message will then be passed to the backend where it can be verified, and the backend can interact with a database / server / whatever and process as it pleases.

## Local development

If you're running a local server, you can specify a custom Starry backend with:

    env REACT_APP_STARRY_BACKEND='http://localhost:8080' npm run start

## Helpful resources

- [Keplr development](https://github.com/chainapsis/keplr-extension#dev)
- [Ethereum concepts](https://github.com/ethereum/EIPs/blob/9a9c5d0abdaf5ce5c5dd6dc88c6d8db1b130e95b/EIPS/eip-4361.md#technical-decisions) about signed typed message from the "Sign-in with Ethereum" initiative.
- [A draft implementation](https://github.com/cosmos/cosmjs/pull/847/files) from [Simon Warta](https://github.com/webmaster128) that may be helpful
- [A test in CosmJS](https://github.com/cosmos/cosmjs/blob/bbd169d99b662816e11955fd7f1153238ce46b8a/packages/amino/src/secp256k1hdwallet.spec.ts#L246-L266) that elucidates signing and verifying using Amino
