'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ArxInteractionDemo() {
  const [address, setAddress] = useState('')
  const [signature, setSignature] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    // This effect is just for demonstration purposes
    // In a real app, you would typically not update environment variables client-side
    if (isDesktop) {
      console.log('Desktop mode is active')
    } else {
      console.log('Mobile mode is active')
    }
  }, [isDesktop])

  const getAddress = async () => {
    // Placeholder for actual address retrieval logic
    setAddress('0x1234...5678')
  }

  const signTransaction = async () => {
    // Placeholder for actual transaction signing logic
    setSignature('0x9876...3210')
  }

  const sendTransaction = async () => {
    if (!signature) {
      alert('Please sign the transaction first')
      return
    }
    setTransactionHash('0xabcd...ef01')
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

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={signTransaction} className="w-full sm:w-auto">Sign Transaction</Button>
          <Input
            value={signature}
            readOnly
            placeholder="Signature will appear here"
            className="flex-grow"
          />
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
      </div>
    </div>
  )
}