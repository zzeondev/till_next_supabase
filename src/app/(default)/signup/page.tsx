import SignUpForm from '@/components/signup/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description: '간단한 정보 입력만으로 새로운 SNS 계정을 만들어보세요.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/signup' },
};

function SignUp() {
  return <SignUpForm />;
}

export default SignUp;
