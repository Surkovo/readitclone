import Axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import InputGroup from '../components/InputGroup';
import { useAuthState } from '../context/auth';
import { getRouteMatcher } from 'next/dist/next-server/lib/router/utils';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { authenticated } = useAuthState();
  const router = useRouter();

  if (authenticated) router.push('/'); // no need to register user if they are already loggedin

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreement) {
      setErrors({
        ...errors,
        agreement: 'You must agree to the T&Cs',
      });
      return;
    }
    try {
      await Axios.post('/auth/register', {
        email,
        password,
        username,
      });
      router.push('/login');
    } catch (err) {
      console.log(err);
      setErrors(err.response.data);
    }
  };

  return (
    <div className="flex bg-white">
      <Head>
        <title>Register</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className="h-screen bg-center bg-cover w-36"
        style={{
          backgroundImage: "url('/images/bricks.jpg')",
        }}
      ></div>
      <div className="flex flex-col justify-center pl-6 ">
        <div className="w-70">
          <h1 className="mb-2 text-lg font-medium">Sign Up</h1>
          <p className="mb-10 text-xs mb-sm">
            {' '}
            By continuing, you agree to out User Agreement and Privacy Policy
          </p>
          <form onSubmit={submitForm}>
            <div className="mb-6">
              <input
                type="checkbox"
                className="mr-1 cursor-pointer"
                id="agreement"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
              />
              <label htmlFor="agreement" className="text-xs cursor-pointer">
                I agree to get emails about cool stuff on Readit
              </label>
            </div>
            <small className="block font-medium text-red-600">
              {errors.agreement}
            </small>
            <InputGroup
              type="email"
              className="mb-2"
              placeholder="EMAIL"
              value={email}
              setValue={setEmail}
              error={errors.email}
            />

            <InputGroup
              type="username"
              className="mb-2"
              placeholder="USERNAME"
              value={username}
              setValue={setUsername}
              error={errors.username}
            />
            <InputGroup
              type="password"
              className="mb-4"
              placeholder="PASSWORD"
              value={password}
              setValue={setPassword}
              error={errors.password}
            />
            <button className="w-full py-2 mb-4 text-xs font-bold text-white uppercase bg-blue-500 border border-blue-500 rounded">
              Sign Up
            </button>
          </form>
          <small>
            Already a member?
            <Link href="/login">
              <a className="ml-1 text-blue-500 uppercase">Log in</a>
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
}
