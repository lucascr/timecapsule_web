import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SessionKit, Session } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'

interface SessionContextType {
  session: Session | null
  login: () => Promise<void>
  logout: () => void
  sessionKit: SessionKit | null
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  login: async () => {},
  logout: () => {},
  sessionKit: null,
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionKit, setSessionKit] = useState<SessionKit | null>(null)

  useEffect(() => {
    const kit = new SessionKit({
      appName: 'TimeCapsule',
      chains: [{
        id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
        url: 'https://waxtestnet.greymass.com'
      }],
      ui: new WebRenderer(),
      walletPlugins: [
        new WalletPluginAnchor(),
        new WalletPluginCloudWallet()
      ],
    })
    setSessionKit(kit)
  }, [])

  const login = async () => {
    if (!sessionKit) return
    try {
      const response = await sessionKit.login()
      setSession(response.session)
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const logout = () => {
    setSession(null)
  }

  return (
    <SessionContext.Provider value={{ session, login, logout, sessionKit }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
} 