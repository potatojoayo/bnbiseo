import { Metadata } from 'next'
import { LoginContent } from './login-content'

export const metadata: Metadata = {
  title: '로그인 · 회원가입 — 비앤비서',
}

export default function LoginPage() {
  return <LoginContent />
}
