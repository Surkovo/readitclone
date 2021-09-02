import '../styles/tailwind.css';
import '../styles/icons.css';
import { AppProps } from 'next/app';
import Axios from 'axios';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/auth';
import { SWRConfig } from 'swr';

Axios.defaults.baseURL = process.env.NEXT_PUBLIC_SERVER_BASE_URL + '/api';
Axios.defaults.withCredentials = true;
//All pages will go thru this component in next.js

function App({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();
  const fetcher = async (url: string) => {
    try {
      const res = await Axios.get(url);
      return res.data;
    } catch (err) {
      throw err.response.data;
    }
  };

  const authRoutes = ['/register', '/login'];
  const authRoute = authRoutes.includes(pathname);
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 1000,
      }}
    >
      <AuthProvider>
        {!authRoute && <Navbar />}
        <div className={authRoute ? '' : 'pt-12'}>
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </SWRConfig>
  );
}

export default App;
