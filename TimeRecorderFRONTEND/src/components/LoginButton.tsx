import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../auth/AuthConfig'

const LoginButton: React.FC = () => {
  const { instance } = useMsal()

  const handleLogin = async () => {
    try {
      const response = await instance.loginPopup(loginRequest)
      localStorage.setItem('access_token', response.accessToken)
      window.location.href = '/dashboard'
    } catch (err) {
      console.error(err)
    }
  }

  return <button onClick={handleLogin}>Login Using Microsoft</button>
}

export default LoginButton
