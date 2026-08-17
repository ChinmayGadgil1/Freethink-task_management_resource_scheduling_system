const API_BASE_URL = 'http://localhost:3000/api/auth'

export interface SignupPayload {
  name: string
  email: string
  password: string
  role: 'PROJECT_MANAGER' | 'RESOURCE'
}

export interface SigninPayload {
  email: string
  password: string
}

export async function signupApi(payload: SignupPayload) {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Signup failed')
  }

  return data
}

export async function signinApi(payload: SigninPayload) {
  const response = await fetch(`${API_BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Sign in failed')
  }

  return data
}
