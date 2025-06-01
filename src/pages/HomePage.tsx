import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Supap</h1>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md border border-primary-500 px-4 py-2 text-sm font-medium text-primary-500 hover:bg-primary-50"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Your Restaurant's Digital Menu
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Create a beautiful digital menu for your restaurant. Easy to update, share, and manage.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="rounded-md bg-primary-500 px-6 py-3 text-lg font-medium text-white hover:bg-primary-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage; 