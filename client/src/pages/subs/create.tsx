import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { FormEvent, useState } from 'react';
import Axios from 'axios';
import classnames from 'classnames';
import e from 'express';
import { useRouter } from 'next/router';

export default function create() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const [errors, setErrors] = useState<Partial<any>>({});
  const router = useRouter();
  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const res = await Axios.post('/subs', { name, title, desc });
      router.push(`/r/${res.data.name}`);
    } catch (err) {
      console.log(err);
      setErrors(err.response.data);
    }
  };
  return (
    <div className="flex bg-white">
      <Head>
        <title>Create a Community</title>
      </Head>
      <div
        className="h-screen bg-center bg-cover w-36"
        style={{
          backgroundImage: "url('/images/bricks.jpg')",
        }}
      ></div>
      <div className="flex flex-col justify-center pl-6 ">
        <div className="w-98">
          <h1 className="mb-2 text-lg font-medium">Create a community</h1>
          <hr />
          <form onSubmit={submitForm}>
            <div className="my-6">
              <p className="font-medium">Name</p>
              <p className="mb-2 text-xs text-gray-500">
                Community names cannot be changed
              </p>
              <input
                className={classnames(
                  'w-full p-3 border border-gray-200 rounded hover:border-gray-500',
                  { 'border-red-600': errors.name }
                )}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <small className="font-medium text-red-600">{errors.name}</small>
            </div>

            <div className="my-6">
              <p className="font-medium">Title</p>
              <p className="mb-2 text-xs text-gray-500">
                Community title represents the topic and you change change it at
                any time.
              </p>
              <input
                className={classnames(
                  'w-full p-3 border border-gray-200 rounded hover:border-gray-500',
                  { 'border-red-600': errors.title }
                )}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <small className="font-medium text-red-600">{errors.title}</small>
            </div>

            <div className="my-6">
              <p className="font-medium">Description</p>
              <p className="mb-2 text-xs text-gray-500">
                This is how new members come to understand the community
              </p>
              <textarea
                className="w-full p-3 border border-gray-200 rounded hover:border-gray-500"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <small className="font-medium text-red-600">{errors.desc}</small>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-1 text-sm font-semibold capitalize blue button">
                Create Community
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  try {
    //go to the /me route on the server to make sure the cookie the server gets was from the server and isn't expired
    const cookie = req.headers.cookie;
    if (!cookie) throw new Error('Missing auth token cookie');
    await Axios.get('/auth/me', { headers: { cookie } }); // check the cookie

    return { props: {} }; // no need to return anything since if it got here it passed the check above
  } catch (err) {
    console.log(err);
    res.writeHead(307, { Location: '/login' }).end();
  }
};
