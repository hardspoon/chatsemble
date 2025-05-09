import { LoginButton } from './LoginButton';

export const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome to Chatsemble</h1>
        <LoginButton />
      </div>
    </div>
  );
};