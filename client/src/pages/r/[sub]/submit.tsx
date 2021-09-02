import Axios from 'axios';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { resourceUsage } from 'process';
import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import Sidebar from '../../../components/Sidebar';
import { Post, Sub } from '../../../types';

export default function Submit() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const router = useRouter();

  const { sub: subName } = router.query;
  const { data: sub, error } = useSWR<Sub>(subName ? `/subs/${subName}` : null);
  if (error) router.push('/');

  const submitPost = async (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() === '') return;
    try {
      const { data: post } = await Axios.post<Post>(`/posts/`, {
        title: title.trim(),
        body,
        sub: subName,
      });
      router.push(`/r/${sub.name}/${post.identifier}/${post.slug}`);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="container flex pt-5">
      <Head>
        <title>Submit to readit</title>
      </Head>
      <div className="w-160">
        <div className="p-4 bg-white rounded">
          <h1 className="mb-3 text-lg">Submit a post to /r/{subName}</h1>
          <form onSubmit={submitPost}>
            <div className="relative mb-2">
              <input
                className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none"
                type="text"
                placeholder="Title"
                maxLength={300}
                onChange={(e) => setTitle(e.target.value)}
                value={title}
              />
              <div
                style={{ top: 11, right: 10 }}
                className="absolute mb-2 text-sm text-gray-300 select-none focus:border-gray-600"
              >
                {/* characters remaining */}
                {title.trim().length}/300
              </div>
            </div>
            <textarea
              className="w-full p-3 border border-gray-300 rounded focus:border-gray-600 focus:outline-none"
              value={body}
              placeholder="Text (Optional)"
              rows={4}
              onChange={(e) => setBody(e.target.value)}
            ></textarea>

            <div className="flex justify-end">
              <button
                className="px-3 py-1 blue button"
                type="submit"
                disabled={title.trim().length === 0}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      {sub && <Sidebar sub={sub} />}
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
