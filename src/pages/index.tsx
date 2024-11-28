import { useSession } from '@/context/SessionContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Get debug mode from environment variable
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === 'true'

export default function Home() {
  const { session, login, logout } = useSession()
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [testEncrypted, setTestEncrypted] = useState('')
  const [testDecrypted, setTestDecrypted] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [hasAvailableId, setHasAvailableId] = useState(false)

  useEffect(() => {
    if (session) {
      checkAvailableId()
    }
  }, [session])

  const checkAvailableId = async () => {
    try {
      
      // Generate hash from username + " 0"
      const hashString = await generateSHA256(session.actor.toString() + " 0")
      console.log("Generated hash:", hashString)
      const response = await fetch(`https://wax-testnet.eosphere.io/v1/chain/get_table_rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: "hashtesttest",
          scope: "hashtesttest",
          table: "idtable",
          index_position: "6",
          json: true,
          key_type: "sha256",
          encode_type: "hex",
          upper_bound: hashString,
          lower_bound: hashString
        })
      })

      const data = await response.json()
      console.log("id:"+JSON.stringify(data, null, 2))
      if (data.rows && data.rows.length > 0) {
        setHasAvailableId(true)
        setPassword(data.rows[0].id.toString())
      } else {
        setHasAvailableId(false)
        setPassword('')
      }
    } catch (error) {
      console.error('Error checking available ID:', error)
      setHasAvailableId(false)
    }
  }

  // Add this function to generate SHA-256 hash
  const generateSHA256 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  const handleGenerateId = async () => {
    if (!session) return
    
    try {
      const action = {
        account: 'hashtesttest',
        name: 'generateid',
        authorization: [{
          actor: session.actor,
          permission: 'active',
        }],
        data: {
          user: session.actor,
        },
      }

      await session.transact({ actions: [action] })
      
      // Wait 5 seconds then check for the ID
      setTimeout(async () => {
        await checkAvailableId()
      }, 5000)
      
    } catch (error) {
      console.error('Error generating ID:', error)
      alert('Failed to generate ID')
    }
  }

  const xorEncryptDecrypt = (text: string, key: string): string => {
    if (!key) return text
    
    const keyLength = key.length
    let result = ''

    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % keyLength)
      )
    }

    return result
  }

  const encodeMessage = (msg: string) => {
    // First encrypt the message with XOR
    const encryptedMsg = xorEncryptDecrypt(msg, password)
    
    // Convert to UTF-8 bytes then to base64
    const bytes = new TextEncoder().encode(encryptedMsg)
    return btoa(String.fromCharCode(...bytes))
  }

  const decodeMessage = (encoded: string): string => {
    if (!encoded) return ''
    
    try {
      // Decode base64 to bytes then to string
      const decoded = atob(encoded)
      const bytes = new Uint8Array(decoded.length)
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    } catch (error) {
      console.error('Decoding error:', error)
      return ''
    }
  }

  const handleTestEncrypt = () => {
    if (!message || !password) {
      alert('Please enter both message and password')
      return
    }
    try {
      const encrypted = encodeMessage(message)
      setTestEncrypted(encrypted)
    } catch (error) {
      console.error('Encryption error:', error)
      alert('Failed to encrypt message')
    }
  }

  const handleTestDecrypt = () => {
    if (!testEncrypted || !testPassword) {
      alert('Please enter both encrypted message and password')
      return
    }
    try {
      const decoded = decodeMessage(testEncrypted)
      const decrypted = xorEncryptDecrypt(decoded, testPassword)
      setTestDecrypted(decrypted)
    } catch (error) {
      console.error('Decryption error:', error)
      alert('Failed to decrypt message. Make sure the message and password are correct.')
    }
  }

  const handleSendMessage = async () => {
    if (!session || !message.trim()) return
    if (!password) {
      alert('Please enter a password to encrypt your message')
      return
    }
    if (!releaseDate) {
      alert('Please select a release date')
      return
    }

    // Convert selected date to Unix timestamp (seconds)
    const releaseDateTimestamp = Math.floor(new Date(releaseDate).getTime() / 1000)
    const currentTimestamp = Math.floor(Date.now() / 1000)

    try {
      const encodedMessage = encodeMessage(message.trim())
      
      // First transaction: sendmsg
      const sendMsgAction = {
        account: 'hashtesttest',
        name: 'sendmsg',
        authorization: [{
          actor: session.actor,
          permission: 'active',
        }],
        data: {
          user: session.actor,
          message: encodedMessage
        },
      }

      const result = await session.transact({ actions: [sendMsgAction] })
      
      if (!result.response?.transaction_id) {
        throw new Error('No transaction ID received')
      }
      
      const txHash = result.response.transaction_id
      console.log('Transaction hash:', txHash)
      console.log('Release_date:', releaseDateTimestamp)

      // Second transaction: generateid
      const generateIdAction = {
        account: 'hashtesttest',
        name: 'saveid',
        authorization: [{
          actor: session.actor,
          permission: 'active',
        }],
        data: {
          user: session.actor,
          str_hash: txHash.toString(),
          release_date: releaseDateTimestamp
        },
      }

      await session.transact({ actions: [generateIdAction] })
      
      // Reset UI state
      setMessage('')
      setReleaseDate('')
      setPassword('')
      setHasAvailableId(false) // This will hide the message section
      
      alert('Message sent successfully! Generate a new ID to send another message.')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div style={{ padding: '20px' }}>
      <h1>TimeCapsule</h1>
      
      {!session ? (
        <button 
          onClick={login}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Login with WAX
        </button>
      ) : (
        <div>
          <p>Logged in as: {session.actor.toString()}</p>
          {!hasAvailableId ? (
            <div style={{ marginBottom: '20px' }}>
              <p>You need to generate an ID before sending messages</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleGenerateId}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Generate ID
                </button>
                <Link href="/messages"
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: '#f0f0f0',
                    textDecoration: 'none',
                    color: 'black',
                    display: 'inline-block'
                  }}
                >
                  View Messages
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                value={password}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#f0f0f0'
                }}
                placeholder="Your ID hash..."
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  marginBottom: '10px'
                }}
                placeholder="Enter your message..."
              />
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Release Date:
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  min={minDate}
                  style={{
                    width: '100%',
                    padding: '10px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Send Message
                </button>
                <Link href="/messages"
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: '#f0f0f0',
                    textDecoration: 'none',
                    color: 'black',
                    display: 'inline-block'
                  }}
                >
                  View Messages
                </Link>
                <button 
                  onClick={logout}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Test Section only shown in debug mode */}
          {DEBUG_MODE && (
            <div style={{ 
              marginTop: '40px', 
              padding: '20px', 
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}>
              <h2>Test Encryption/Decryption</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={handleTestEncrypt}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                  }}
                >
                  Test Encrypt Current Message
                </button>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Encrypted:</strong>
                  <textarea
                    value={testEncrypted}
                    readOnly
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '10px',
                      marginTop: '5px'
                    }}
                  />
                </div>
              </div>

              <div>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '10px'
                  }}
                  placeholder="Enter decryption password..."
                />
                
                <button
                  onClick={handleTestDecrypt}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                  }}
                >
                  Test Decrypt
                </button>

                <div>
                  <strong>Decrypted Result:</strong>
                  <textarea
                    value={testDecrypted}
                    readOnly
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '10px',
                      marginTop: '5px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 