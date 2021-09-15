import Axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import InputGroup from '../components/InputGroup';
import { useAuthState, useAuthDispatch } from '../context/auth';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const dispatch = useAuthDispatch();
  const { authenticated } = useAuthState();
  const router = useRouter();

  if (authenticated) router.push('/'); // send the user to the homepage if user logged in. no need to show them the login page

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await Axios.post('/auth/login', {
        username,
        password,
      });
      dispatch('LOGIN', res.data);
      router.back();
    } catch (err) {
      setErrors(err.response.data);
    }
  };

  return (
    <div className="flex bg-white">
      <Head>
        <title>Login</title>
      </Head>
      <div
        className="h-screen bg-center bg-cover w-36"
        style={{
          backgroundImage: `url('${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/images/bricks.jpg')`,
        }}
      ></div>
      <div className="flex flex-col justify-center pl-6 ">
        <div className="w-70">
          <h1 className="mb-2 text-lg font-medium">Login</h1>
          <p className="mb-10 text-xs mb-sm">
            {' '}
            By continuing, you agree to out User Agreement and Privacy Policy
          </p>
          <form onSubmit={submitForm}>
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
              Login
            </button>
          </form>
          <small>
            New to Readit?
            <Link href="/register">
              <a className="ml-1 text-blue-500 uppercase">Sign Up</a>
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
}
