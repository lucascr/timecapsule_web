import { useSession } from '@/context/SessionContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  id: number
  user: string
  message: string
  release_date: number
  hash_str: string
}

export default function Messages() {
  const { session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const fetchTransactionMessage = async (txhash: string, txtid: string) => {
    try {
      const response = await fetch(`https://wax-testnet.eosphere.io/v1/history/get_transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: txhash
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Find the sendmsg action and get its data.message
      const sendmsgAction = data.traces.find(
        (trace: any) => 
          trace.act.name === 'sendmsg' && 
          trace.act.account === 'hashtesttest'
      )

      if (sendmsgAction?.act?.data?.message) {
        // First decode from base64
        const decoded = decodeMessage(sendmsgAction.act.data.message)
        // Then decrypt using txtid as key
        const decrypted = xorEncryptDecrypt(decoded, txtid.toString())
        return decrypted
      }

      return 'Message not found'
    } catch (err) {
      console.error('Error fetching transaction:', err)
      return 'Error loading message'
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`https://wax-testnet.eosphere.io/v1/chain/get_table_rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'hashtesttest',
          scope: 'hashtesttest',
          table: 'idtable',
          limit: 100,
          json: true,
          index_position: '5',
          key_type: 'i64',
          lower_bound: '1704067200',
          upper_bound: '1735689600'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.rows && Array.isArray(data.rows)) {
        // Fetch messages for available messages
        const messagesData = await Promise.all(
          data.rows.map(async (row: any) => {
            const message = isMessageAvailable(row.release_date) 
              ? await fetchTransactionMessage(row.hash_str,row.id)
              : 'Message Locked'
            
            return {
              id: row.id,
              user: row.user,
              release_date: row.release_date,
              hash_str: row.hash_str,
              message: message
            }
          })
        )

        const sortedMessages = messagesData.sort((b, a) => 
          new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        )

        setMessages(sortedMessages)
      } else {
        setError('No messages found')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const formatDate = (dateString: string) => {
    return dateString.split('T')[0];
  }

  const isMessageAvailable = (releaseDate: string) => {
    const now = new Date()
    const releaseDateTime = new Date(releaseDate)
    return now >= releaseDateTime
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>Time Capsule Messages</h1>
        <Link href="/"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#f0f0f0',
            textDecoration: 'none',
            color: 'black',
            borderRadius: '4px'
          }}
        >
          Back to Home
        </Link>
      </div>

      {loading ? (
        <p>Loading messages...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : messages.length === 0 ? (
        <p>No messages found</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {messages.map((msg) => (
            <div 
              key={msg.id}
              style={{ 
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: isMessageAvailable(msg.release_date) ? '#f9f9f9' : '#f0f0f0'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <strong>From:</strong> {msg.user}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Release Date:</strong> {formatDate(msg.release_date)}
              </div>
              <div style={{ marginBottom: '10px' }}>
                {isMessageAvailable(msg.release_date) ? (
                  <div>
                    <strong>Message: </strong>
                    {msg.message}
                  </div>
                ) : (
                  <div>
                    <strong>Status: </strong>
                    Locked until release date
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 