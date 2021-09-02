import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import useSWR, { useSWRInfinite } from 'swr';
import PostCard from '../components/Postcard';
import { useAuthState } from '../context/auth';
import { Sub, Post } from '../types';

export default function Home() {
  const [observedPost, setObserverdPost] = useState('');
  // const { data: posts } = useSWR<Post[]>('/posts'); // this could be null, so add a ? to mapping statement in the return
  const { data: topSubs } = useSWR<Sub[]>('/misc/top-subs');
  const { authenticated } = useAuthState();

  const {
    data,
    error,
    size: page,
    setSize: setPage,
    isValidating,
    revalidate,
  } = useSWRInfinite<Post[]>((index) => `/posts?page=${index}`);

  const isInitialLoading = !data && !error;
  const posts = data ? [].concat(...data) : [];

  //  replaced with useSWR fetch

  // const [posts, setPosts] = useState<Post[]>([]);

  // useEffect(() => {
  //   Axios.get('/posts')
  //     .then((res) => setPosts(res.data))
  //     .catch((err) => console.log(err));
  // }, []);
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const id = posts[posts.length - 1].identifier; // this gets the last post
    if (id !== observedPost) {
      setObserverdPost(id);
      observeElement(document.getElementById(id));
    }
  }, [posts]);

  const observeElement = (element: HTMLElement) => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting === true) {
          console.log('botmmtmtmtmtm');
          setPage(page + 1); // this tell swr to go fetch more posts
          observer.unobserve(element);
        }
      },
      { threshold: 1 }
    ); // threshold: 0 is top and 1 is the bottom of the viewport
    observer.observe(element);
  };
  const title = 'Readit';
  const description =
    "Readit is a network of communities based on peoples interests. Find a communities you're interested in, and become part of an onlin community";
  return (
    <Fragment>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description}></meta>
        <meta property="og:title" content={description}></meta>
        <meta property="og:description" content={description}></meta>
        <meta property="twitter:title" content={title}></meta>
        <meta property="twitter:description" content={description}></meta>
      </Head>
      <div className="container flex pt-4">
        {/* Post feed*/}
        <div className="w-full px-4 md:w-160 md:p-0">
          {isInitialLoading && (
            <p className="text-lg text-center">Loading Posts</p>
          )}
          {posts?.map((post) => (
            <PostCard
              post={post}
              key={post.identifier}
              revalidate={revalidate}
            />
          ))}
          {isValidating && posts.length > 0 && (
            <p className="text-lg text-center">Loading moreeeee</p>
          )}
        </div>
        {/* Sidebar*/}
        <div className="hidden ml-6 md:block w-80">
          <div className="bg-white rounded">
            <div className="p-4 border-b-2">
              <p className="text-lg font-semibold text-center">
                Top Communities
              </p>
            </div>
            <div>
              {topSubs?.map((sub) => (
                <div
                  className="flex items-center px-4 py-2 text-xs border-b"
                  key={sub.name}
                >
                  <Link href={`/r/${sub.name}`}>
                    <a href="">
                      <Image
                        src={sub.imageUrl}
                        alt="Sub image"
                        className="rounded-full cursor-pointer "
                        width={(6 * 16) / 4}
                        height={(6 * 16) / 4}
                      />
                    </a>
                  </Link>
                  <Link href={`/r/${sub.name}`}>
                    <a className="ml-2 font-bold hover:cursor-pointer">
                      /r/${sub.name}
                    </a>
                  </Link>
                  <p className="ml-auto font-med">{sub.postCount}</p>
                </div>
              ))}
            </div>
            {authenticated && (
              <div className="p-4 border-t-2">
                <Link href="/subs/create">
                  <a className="w-full px-2 py-1 blue button">
                    Create Community
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

//this is for serverside rendering. Doesn't make for the fast webpage, as it waits to the posts, so the page isn't interactive until then
//the advantage is SEO

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   try {
//     const res = await Axios.get('/posts');
//     return { props: { posts: res.data } };
//   } catch (err) {
//     console.log(err);
//     return {
//       props: { error: 'something went wrong rendering posts serverside' },
//     };
//   }
// };
