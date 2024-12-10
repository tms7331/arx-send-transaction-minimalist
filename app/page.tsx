'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import QRCode from 'react-qr-code';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { execHaloCmdWeb, HaloGateway } from '@arx-research/libhalo/api/web'
import { Interface } from '@ethersproject/abi';
import { serialize } from "@ethersproject/transactions";
import { keccak256 } from "@ethersproject/keccak256";
import { hexlify } from "@ethersproject/bytes";
import { createPublicClient, http } from 'viem';

// Hardcoded values for Sepolia - 
// Remember - you must have testnet tokens on sepolia for the transaction to work!
// For other networks - can alternatively use viem/chains
// Or find RPC endpoints and chainIds here:
// https://chainlist.org/
// Can try a public RPC endpoint, I had some issues so switched to infura
//const RPCURL = 'https://ethereum-sepolia-rpc.publicnode.com';
const RPCURL = process.env.NEXT_PUBLIC_RPCURL;
const CHAINID = 11155111;

async function getTransaction(ourAddress: `0x${string}`) {
  // we only need 'ourAddress' to automatically get nonce

  // Deployed an example contract on sepolia that contains this function:
  //   function storeNumber(uint256 _number) public {
  //       emit CallSuccess(_number);
  //   }

  // Code for generating data field - if you just want to send a transfer set: const txData = "0x"
  const abi = [
    "function storeNumber(uint256 _number) public"
  ];
  const iface = new Interface(abi);
  const amount = 12321;
  const txData = iface.encodeFunctionData("storeNumber", [amount]);

  const client = createPublicClient({
    transport: http(RPCURL),
  });
  const nonce = await client.getTransactionCount({ address: ourAddress });

  const transaction = {
    // Hardcoding a contract address deployed on sepolia
    to: '0x585Ab35e3Ffe0e2A048352f34fa0B58B80299ED5',
    value: BigInt("0"),
    // 21k for a transfer, for contract interactions will need more
    gasLimit: BigInt("25000"),
    maxFeePerGas: BigInt('20000000000'),
    maxPriorityFeePerGas: BigInt('2000000000'),
    data: txData,
    nonce: nonce,
    type: 2,
    chainId: CHAINID,
  };
  return transaction;
}

function getDigest(transaction: any) {
  const serializedTransaction = serialize(transaction);
  const transactionHash = keccak256(serializedTransaction);
  const digest = hexlify(transactionHash).substring(2);
  return digest;
}

async function broadcastTransaction(transaction: any, v: number, r: `0x${string}`, s: `0x${string}`) {
  let txHashRet = ""
  const signedTransaction = serialize(transaction, { r, s, v });
  const client = createPublicClient({
    transport: http(RPCURL),
  });
  console.log("SENDING SIGNED TX ", signedTransaction)
  const resp = await client.sendRawTransaction({
    serializedTransaction: signedTransaction as `0x${string}`
  })
    .then((txHash: any) => {
      console.log('Transaction hash:', txHash);
      txHashRet = txHash
    })
    .catch((error: any) => {
      console.error('Error sending transaction:', error);
    });
  return txHashRet;
}


type Signature = {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
}

export default function ArxInteractionDemo() {
  const [address, setAddress] = useState('')

  const [signatureVRS, setSignatureVRS] = useState<Signature | null>(null)
  const [signatureDisplay, setSignatureDisplay] = useState('')
  const [transaction, setTransaction] = useState({})
  const [transactionHash, setTransactionHash] = useState('')
  const [isDesktop, setIsDesktop] = useState(true)
  const [statusText, setStatusText] = useState('')

  const [qrcAddr, setQrcAddr] = useState("");
  const [qrcTx, setQrcTx] = useState("");


  const getAddress = async () => {
    if (isDesktop) {
      console.log('Getting Address in desktop mode')
      await desktopArxGetAddress()
    } else {
      console.log('Getting Address in mobile mode')
      await mobileArxGetAddress()
    }
  }

  const signTransaction = async () => {
    if (!address) {
      alert('Please get address first')
      return
    }
    if (isDesktop) {
      console.log('Signing transaction in desktop mode')
      await desktopArxSignTx(address)
    } else {
      console.log('Signing transaction in mobile mode')
      await mobileArxSignTx(address)
    }
  }


  const sendTransaction = async () => {
    if (!signatureVRS) {
      alert('Please sign the transaction first')
      return
    }
    const v = signatureVRS.v;
    const r = "0x" + signatureVRS.r as `0x${string}`;
    const s = "0x" + signatureVRS.s as `0x${string}`;
    const txHash = await broadcastTransaction(transaction, v, r, s);
    console.log("txHash", txHash)
    setTransactionHash(txHash)
    setStatusText(`https://sepolia.etherscan.io/tx/${txHash}`)
  }


  async function desktopArxGetAddress() {
    const cmd = {
      name: 'get_pkeys',
    };

    const gate = new HaloGateway('wss://s1.halo-gateway.arx.org', {
      createWebSocket: (url) => new W3CWebSocket(url) as unknown as WebSocket
    });
    const pairInfo = await gate.startPairing();
    setQrcAddr(pairInfo.execURL);
    console.log('Waiting for smartphone to connect...');
    try {
      await gate.waitConnected();
    } catch (e) {
      console.error('caught error when waitConnected()');
      console.log(e);
    }
    try {
      const res = await gate.execHaloCmd(cmd);
      const walletAddress = res.etherAddresses[1];
      setAddress(walletAddress);
      setStatusText("Scan successful! Continue to Profile!");
      setQrcAddr("");
    } catch (e) {
      console.log('caught error when execHaloCmd');
    }
  }


  async function desktopArxSignTx(tag: string) {
    const transaction = await getTransaction(address as `0x${string}`);
    setTransaction(transaction)
    const digest = getDigest(transaction);

    const cmd = {
      name: 'sign',
      keyNo: 1,
      digest: digest
    };

    const gate = new HaloGateway('wss://s1.halo-gateway.arx.org', {
      createWebSocket: (url) => new W3CWebSocket(url) as unknown as WebSocket
    });
    const pairInfo = await gate.startPairing();
    setQrcTx(pairInfo.execURL);
    console.log('Waiting for smartphone to connect...');
    try {
      await gate.waitConnected();
    } catch (e) {
      console.error('caught error when waitConnected()');
      console.log(e);
    }

    try {
      const res = await gate.execHaloCmd(cmd);
      setSignatureVRS(res.signature.raw)
      // NOTE - this value is not actually used anywhere, 
      // just for display to indicate we can go to the next step
      setSignatureDisplay(res.signature.ether);
      setQrcTx("");
    } catch (e) {
      console.log('caught error when execHaloCmd');
    }
  }


  async function mobileArxGetAddress() {
    // Note - this will ONLY work on mobile
    // Need separate function for desktop compatability
    const cmd = {
      name: 'get_pkeys',
    };
    try {
      const res = await execHaloCmdWeb(cmd, {
        statusCallback: (cause) => {
          if (cause === "init") {
            setStatusText("Please tap the tag to the back of your smartphone and hold it...");
          } else if (cause === "retry") {
            setStatusText("Something went wrong, please try to tap the tag again...");
          } else if (cause === "scanned") {
            setStatusText("Tag scanned successfully, post-processing the result...");
          } else {
            setStatusText(cause);
          }
        }
      });
      // the command has succeeded, display the result to the user
      const walletAddress = res.etherAddresses[1];
      setAddress(walletAddress);
      setStatusText("Scan successful! Continue to Profile!");
    } catch (e) {
      // the command has failed, display error to the user
      setStatusText('Scanning failed, click on the button again to retry. Details: ' + String(e));
    }
  }


  async function mobileArxSignTx(tag: string) {
    const transaction = await getTransaction(address as `0x${string}`);
    setTransaction(transaction)

    const digest = getDigest(transaction);
    const cmd = {
      name: 'sign',
      keyNo: 1,
      digest: digest
    };

    try {
      const res = await execHaloCmdWeb(cmd, {
        statusCallback: (cause) => {
          if (cause === "init") {
            setStatusText("Please tap the tag to the back of your smartphone and hold it...");
          } else if (cause === "retry") {
            setStatusText("Something went wrong, please try to tap the tag again...");
          } else if (cause === "scanned") {
            setStatusText("Tag scanned successfully, post-processing the result...");
          } else {
            setStatusText(cause);
          }
        }
      });

      setSignatureVRS(res.signature.raw)
      // NOTE - this value is not actually used anywhere, 
      // just for display to indicate we can go to the next step
      setSignatureDisplay(res.signature.ether);
      setQrcTx("");
      setStatusText("");
    } catch (e) {
      // the command has failed, display error to the user
      setStatusText('Scanning failed, click on the button again to retry. Details: ' + String(e));
    }
  }


  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Arx Interaction Demo</h1>
      <div className="flex items-center justify-center mb-6 space-x-2">
        <Label
          htmlFor="device-toggle"
          className={`${isDesktop ? 'text-gray-400' : 'text-gray-900'}`}
        >
          Mobile
        </Label>
        <Switch
          id="device-toggle"
          checked={isDesktop}
          onCheckedChange={setIsDesktop}
        />
        <Label
          htmlFor="device-toggle"
          className={`${isDesktop ? 'text-gray-900' : 'text-gray-400'}`}
        >
          Desktop
        </Label>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={getAddress} className="w-full sm:w-auto">Get address</Button>
          <Input
            value={address}
            readOnly
            placeholder="Address will appear here"
            className="flex-grow"
          />
        </div>

        <div>
          {qrcAddr && (
            <QRCode value={qrcAddr} />
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={signTransaction} className="w-full sm:w-auto">Sign Transaction</Button>
          <Input
            value={signatureDisplay}
            readOnly
            placeholder="Signature will appear here"
            className="flex-grow"
          />
        </div>

        <div>
          {qrcTx && (
            <QRCode value={qrcTx} />
          )}
        </div>


        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={sendTransaction} className="w-full sm:w-auto">Send transaction</Button>
          <Input
            value={transactionHash}
            readOnly
            placeholder="Transaction hash will appear here"
            className="flex-grow"
          />
        </div>

        <div>
          {statusText && (
            <p>{statusText}</p>
          )}
        </div>

      </div>
    </div>
  )
}