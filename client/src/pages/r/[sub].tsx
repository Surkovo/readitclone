import Head from 'next/head';
import Axios from 'axios';
import { useRouter } from 'next/router';
import { ChangeEvent, createRef, Fragment, useEffect, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import classNames from 'classnames';
import Postcard from '../../components/Postcard';
import Sidebar from '../../components/Sidebar';
import { Sub } from '../../types';
import { useAuthState } from '../../context/auth';
import { type } from 'os';

export default function SubPage() {
  //Local State
  const [ownSub, setOwnSub] = useState(false);
  //Global State
  const { user, authenticated } = useAuthState();
  //Utils
  const router = useRouter();
  const fileInputRef = createRef<HTMLInputElement>();
  const subName = router.query.sub;
  const {
    data: sub,
    error,
    revalidate,
  } = useSWR<Sub>(subName ? `/subs/${subName}` : null); // with SWR we can use conditional fetching like this. The error is coming from the fetcher defined in the app.tsx

  useEffect(() => {
    if (!sub) return;
    setOwnSub(authenticated && user.username === sub.username);
  }, [sub]);

  const openFileInput = (type: string) => {
    if (!ownSub) return;
    fileInputRef.current.name = type; // these come from the HTMLINput type
    fileInputRef.current.click();
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileInputRef.current.name);
    try {
      await Axios.post<Sub>(`/subs/${sub.name}/image`, formData, {
        headers: { 'Content-Type': 'multiplart/form-data' },
      });
      revalidate();
    } catch (err) {
      console.log(err);
    }
  };

  let postMarkup;
  if (error) router.push('/'); // if a sub isn't found in the db, redirect to the home page
  if (!sub) {
    postMarkup = <p className="text-lg text-center">Loading....</p>;
  } else if (sub.posts.length === 0) {
    postMarkup = <p className="text-lg text-center">No Posts yet</p>;
  } else {
    postMarkup = sub.posts.map((post) => (
      <Postcard key={post.identifier} post={post} revalidate={revalidate} />
    ));
  }
  return (
    <div>
      <Head>
        <title>{sub?.title}</title>
      </Head>

      <input
        type="file"
        hidden={true}
        ref={fileInputRef}
        onChange={uploadImage}
      />

      {sub && (
        <Fragment>
          {/*Sub info and images*/}
          <div>
            {/*Check for banner image*/}
            <div
              onClick={() => openFileInput('banner')}
              className={classNames('bg-blue-500', {
                'cursor-pointer': ownSub,
              })}
            >
              {sub.bannerUrl ? (
                <div
                  className="h-56 bg-blue-500"
                  style={{
                    backgroundImage: `url(${sub.bannerUrl})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                ></div>
              ) : (
                <div className="h-20 bg-blue-500"></div>
              )}
            </div>
            {/*Sub meta data*/}
            <div className="h-20 bg-white">
              <div className="container relative flex">
                <div className="absolute" style={{ top: -15 }}>
                  <Image
                    src={sub.imageUrl}
                    onClick={() => openFileInput('image')}
                    width={70}
                    height={70}
                    className={classNames('bg-blue-500 rounded-full', {
                      'cursor-pointer': ownSub,
                    })}
                  />
                </div>
              </div>
              <div className="pt-1 pl-24">
                <div className="flex items-center">
                  <h1 className="mb-1 text-3xl font-bold">{sub.title}</h1>
                </div>
                <p className="text-sm text-gray-600">/r/{sub.name}</p>
              </div>
            </div>
          </div>
          {/* Posts and sidebar*/}
          <div className="flex pt-5 conatiner">
            <div className="w-160">{postMarkup}</div>
            <Sidebar sub={sub} />
          </div>
        </Fragment>
      )}
    </div>
  );
}
